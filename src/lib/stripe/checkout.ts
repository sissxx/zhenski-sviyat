import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/site-origin";
import { paymentSucceeded } from "@/lib/payments/notifications";
import { idOf, isoFromUnix, stripe } from "./server";

/**
 * Stripe Checkout for one-time payments (paid events, prepaid consultations) and monthly plans.
 *
 * The database decides what is owed: register_for_event / book_consultation create a pending payment
 * with the server-side price, and this module only turns that payment into a Checkout Session.
 * Payments are confirmed by the webhook, or by asking Stripe when the user comes back. The browser
 * redirect on its own proves nothing.
 *
 * Writes here use the service key (payments have no write policy for users), so every function checks
 * that the payment or subscription belongs to the signed-in user before acting.
 */

/** Stripe needs Checkout Sessions to live at least 30 minutes; a little margin for the request itself. */
const MIN_SESSION_MS = 31 * 60_000;
const MAX_SESSION_MS = 23 * 3600_000;

export type CheckoutResult =
  | { kind: "redirect"; url: string }
  /** The session was already paid; the confirmation page shows the result. */
  | { kind: "paid" }
  /** Nothing to pay by card: wrong owner, not a card payment, or no longer pending. */
  | { kind: "not_payable" };

/** The user's Stripe customer, created on first use so all their payments and plans share one. */
export async function stripeCustomerFor(userId: string): Promise<string> {
  const db = createAdminClient();
  const { data: existing } = await db.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (existing) return existing.stripe_customer_id;

  const { data: profile, error } = await db.from("profiles").select("email, first_name, last_name").eq("id", userId).single();
  if (error) throw error;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || undefined;
  const customer = await stripe().customers.create(
    { email: profile.email, name, preferred_locales: ["bg"], metadata: { user_id: userId } },
    { idempotencyKey: `customer-${userId}` },
  );
  await db.from("stripe_customers").upsert({ user_id: userId, stripe_customer_id: customer.id }, { ignoreDuplicates: true });
  // Two tabs at once: whichever row was stored first wins.
  const { data: stored } = await db.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).single();
  return stored?.stripe_customer_id ?? customer.id;
}

type PaymentCheckoutInput = {
  paymentId: string;
  userId: string;
  /** Same-site paths. `{CHECKOUT_SESSION_ID}` is filled in by Stripe on success. */
  successPath: string;
  cancelPath: string;
};

/** A Checkout Session for a pending card payment: the open one if there is one, otherwise a new one. */
export async function startPaymentCheckout({ paymentId, userId, successPath, cancelPath }: PaymentCheckoutInput): Promise<CheckoutResult> {
  const db = createAdminClient();
  const { data: payment, error } = await db
    .from("payments")
    .select("id, user_id, provider, status, amount_cents, description, expires_at, stripe_checkout_session_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (error) throw error;
  if (!payment || payment.user_id !== userId || payment.provider !== "stripe") return { kind: "not_payable" };
  if (payment.status === "succeeded") return { kind: "paid" };
  if (payment.status !== "pending" || (payment.expires_at && new Date(payment.expires_at).getTime() <= Date.now())) {
    return { kind: "not_payable" };
  }

  if (payment.stripe_checkout_session_id) {
    const session = await stripe().checkout.sessions.retrieve(payment.stripe_checkout_session_id);
    if (session.status === "open" && session.url) return { kind: "redirect", url: session.url };
    if (session.status === "complete") {
      await applyCheckoutSession(session);
      return { kind: "paid" };
    }
  }

  const now = Date.now();
  const holdEnds = payment.expires_at ? new Date(payment.expires_at).getTime() : now;
  const expiresAt = Math.min(Math.max(holdEnds, now + MIN_SESSION_MS), now + MAX_SESSION_MS);
  // Whole minutes, so a double click sends identical parameters under the same idempotency key.
  const expiresAtSeconds = Math.ceil(expiresAt / 60_000) * 60;
  const origin = await siteOrigin();
  const customer = await stripeCustomerFor(userId);

  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer,
      client_reference_id: payment.id,
      metadata: { payment_id: payment.id },
      payment_intent_data: { metadata: { payment_id: payment.id }, description: payment.description ?? undefined },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: payment.amount_cents,
            product_data: { name: payment.description || "Плащане" },
          },
        },
      ],
      // Cards only (wallets like Apple Pay and Google Pay count as cards): they settle at once, so a seat
      // or slot hold never waits days for a bank debit.
      allowed_payment_method_types: ["card"],
      locale: "bg",
      expires_at: expiresAtSeconds,
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
    },
    // A double click reuses the same session instead of creating two.
    { idempotencyKey: `checkout-${payment.id}-${payment.stripe_checkout_session_id ?? "first"}` },
  );
  await db.from("payments").update({ stripe_checkout_session_id: session.id }).eq("id", payment.id);
  if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL.");
  return { kind: "redirect", url: session.url };
}

/** Expires the open Checkout Session of a payment, e.g. when the user cancels the registration. */
export async function expireOpenCheckout(paymentId: string): Promise<void> {
  const db = createAdminClient();
  const { data } = await db.from("payments").select("stripe_checkout_session_id").eq("id", paymentId).maybeSingle();
  if (!data?.stripe_checkout_session_id) return;
  try {
    const session = await stripe().checkout.sessions.retrieve(data.stripe_checkout_session_id);
    if (session.status === "open") await stripe().checkout.sessions.expire(session.id);
  } catch (error) {
    console.error("expireOpenCheckout", error);
  }
}

/**
 * Records what a completed Checkout Session paid for. Safe to call any number of times: the database
 * functions ignore repeats. Used by the webhook and when the user returns from Stripe.
 */
export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode === "subscription") {
    const subscriptionId = idOf(session.subscription);
    if (subscriptionId) await syncSubscriptionById(subscriptionId);
    return;
  }

  const paymentId = session.client_reference_id ?? session.metadata?.payment_id;
  if (!paymentId) return; // not one of ours (e.g. created by hand in the dashboard)
  if (session.payment_status !== "paid") return; // card payments are paid at completion; anything else waits

  const db = createAdminClient();
  const { data: payment, error } = await db.rpc("mark_payment_succeeded", {
    p_payment_id: paymentId,
    p_amount_cents: session.amount_total ?? 0,
    p_stripe_payment_intent_id: idOf(session.payment_intent) ?? undefined,
    p_stripe_checkout_session_id: session.id,
  });
  if (error) throw error;
  await paymentSucceeded(payment.id);
}

/**
 * Checks a Checkout Session the user just came back from (success_url) and records it right away,
 * so the confirmation page can show the result without waiting for the webhook.
 * Only sessions that belong to `userId` are applied. Errors are logged; the webhook retries anyway.
 */
export async function syncReturnedCheckout(sessionId: string, userId: string): Promise<void> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return;
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.status !== "complete") return;
    if (session.mode === "subscription") {
      if (session.metadata?.user_id !== userId) return;
    } else {
      const paymentId = session.client_reference_id;
      if (!paymentId) return;
      const { data } = await createAdminClient().from("payments").select("user_id").eq("id", paymentId).maybeSingle();
      if (data?.user_id !== userId) return;
    }
    await applyCheckoutSession(session);
  } catch (error) {
    console.error("syncReturnedCheckout", error);
  }
}

// ---------------------------------------------------------------------------
// Monthly plans (Stripe Billing)
// ---------------------------------------------------------------------------

type PlanRow = {
  id: string;
  name: string;
  price_cents: number;
  billing_interval: "month" | "year";
  stripe_product_id: string | null;
  stripe_price_id: string | null;
};

/**
 * The Stripe Price for a plan at its current price. Product and Price are created on first use, and
 * a new Price is made when an admin changes the plan's price, so nobody has to set them up in Stripe.
 * Existing subscribers keep the price they signed up with (Stripe's normal behaviour).
 */
export async function ensurePlanPrice(plan: PlanRow): Promise<string> {
  const db = createAdminClient();
  const interval = plan.billing_interval === "year" ? "year" : "month";

  if (plan.stripe_price_id) {
    try {
      const price = await stripe().prices.retrieve(plan.stripe_price_id);
      if (price.active && price.currency === "eur" && price.unit_amount === plan.price_cents && price.recurring?.interval === interval) {
        return price.id;
      }
    } catch (error) {
      console.error("ensurePlanPrice: stored price not usable, creating a new one", error);
    }
  }

  let productId = plan.stripe_product_id;
  if (!productId) {
    const product = await stripe().products.create(
      { name: plan.name, metadata: { plan_id: plan.id } },
      { idempotencyKey: `plan-product-${plan.id}` },
    );
    productId = product.id;
  }
  const price = await stripe().prices.create(
    {
      product: productId,
      currency: "eur",
      unit_amount: plan.price_cents,
      recurring: { interval },
      metadata: { plan_id: plan.id },
    },
    { idempotencyKey: `plan-price-${plan.id}-${productId}-${plan.price_cents}-${interval}` },
  );
  const { error } = await db
    .from("membership_plans")
    .update({ stripe_product_id: productId, stripe_price_id: price.id })
    .eq("id", plan.id);
  if (error) throw error;
  return price.id;
}

/** A Checkout Session in subscription mode for one plan. The caller has checked the user may subscribe. */
export async function startSubscriptionCheckout(plan: PlanRow, userId: string, returnPath: string): Promise<string> {
  const priceId = await ensurePlanPrice(plan);
  const origin = await siteOrigin();
  const customer = await stripeCustomerFor(userId);
  const metadata = { user_id: userId, plan_id: plan.id };
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: userId,
    metadata,
    subscription_data: { metadata },
    line_items: [{ price: priceId, quantity: 1 }],
    allowed_payment_method_types: ["card"],
    locale: "bg",
    success_url: `${origin}${returnPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${returnPath}?plashtane=prekasnato`,
  });
  if (!session.url) throw new Error("Stripe returned a Checkout Session without a URL.");
  return session.url;
}

export async function syncSubscriptionById(subscriptionId: string): Promise<void> {
  // Always read the current state from Stripe, so events arriving out of order can't roll it back.
  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

/** Copies a Stripe subscription into the subscriptions table (sync_stripe_subscription). */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const db = createAdminClient();
  const customerId = idOf(subscription.customer);
  if (!customerId) throw new Error(`Subscription ${subscription.id} has no customer.`);

  let userId = subscription.metadata?.user_id || null;
  if (!userId) {
    const { data } = await db.from("stripe_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id ?? null;
  }
  if (!userId) throw new Error(`Subscription ${subscription.id} has no known user.`);

  const item = subscription.items.data[0];
  if (!item) throw new Error(`Subscription ${subscription.id} has no items.`);

  // The database matches the plan by its current stripe_price_id. After a price change, older
  // subscriptions still run on the previous price, so look the plan up by id first.
  const planColumns = "id, stripe_price_id";
  const metadataPlanId = subscription.metadata?.plan_id;
  const { data: plan } = metadataPlanId
    ? await db.from("membership_plans").select(planColumns).eq("id", metadataPlanId).maybeSingle()
    : await db.from("membership_plans").select(planColumns).eq("stripe_price_id", item.price.id).maybeSingle();
  if (!plan?.stripe_price_id) throw new Error(`No plan for subscription ${subscription.id}.`);

  const { error } = await db.rpc("sync_stripe_subscription", {
    p_user_id: userId,
    p_stripe_subscription_id: subscription.id,
    p_stripe_customer_id: customerId,
    p_stripe_price_id: plan.stripe_price_id,
    p_status: subscription.status,
    p_current_period_start: isoFromUnix(item.current_period_start) ?? new Date().toISOString(),
    p_current_period_end: isoFromUnix(item.current_period_end) ?? new Date().toISOString(),
    p_cancel_at_period_end: subscription.cancel_at_period_end || subscription.cancel_at != null,
    p_canceled_at: isoFromUnix(subscription.canceled_at),
    p_ended_at: isoFromUnix(subscription.ended_at),
  });
  if (error) throw error;
}
