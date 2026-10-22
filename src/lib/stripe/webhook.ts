import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentFailed, subscriptionPaymentFailed } from "@/lib/payments/notifications";
import { applyCheckoutSession, syncSubscription, syncSubscriptionById } from "./checkout";
import { idOf, stripe } from "./server";

/**
 * What each Stripe event changes. Everything here is idempotent: the database functions ignore repeats
 * and never downgrade a settled payment, and subscriptions are re-read from Stripe, so a retried or
 * out-of-order delivery ends in the same state.
 */

/** Events the webhook endpoint in Stripe should send (docs/payments.md). */
export const handledEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
] as const;

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await applyCheckoutSession(event.data.object);
      return;

    case "checkout.session.expired":
      await failCheckoutPayment(event.data.object, "expired", "checkout_expired");
      return;

    case "checkout.session.async_payment_failed":
      await failCheckoutPayment(event.data.object, "failed", "payment_failed");
      return;

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      if (await isOurSubscription(event.data.object)) await syncSubscriptionById(event.data.object.id);
      return;

    case "invoice.paid":
    case "invoice.payment_failed":
      await recordInvoice(event.data.object, event.type === "invoice.paid");
      return;

    case "charge.refunded":
      await recordChargeRefund(event.data.object);
      return;
  }
}

/** Expired or failed Checkout for a one-time payment: release the seat or slot. */
async function failCheckoutPayment(session: Stripe.Checkout.Session, status: "expired" | "failed", reason: string) {
  if (session.mode !== "payment") return; // an abandoned subscription checkout leaves nothing behind
  const paymentId = session.client_reference_id ?? session.metadata?.payment_id;
  if (!paymentId) return;

  const db = createAdminClient();
  // A newer session may have replaced this one (the user went back and tried again).
  const { data: payment } = await db.from("payments").select("stripe_checkout_session_id").eq("id", paymentId).maybeSingle();
  if (!payment || (payment.stripe_checkout_session_id && payment.stripe_checkout_session_id !== session.id)) return;

  const { data, error } = await db.rpc("mark_payment_failed", { p_payment_id: paymentId, p_status: status, p_reason: reason });
  if (error) throw error;
  if (data.status === status) await paymentFailed(paymentId);
}

/** Subscriptions created on this site carry the user id; anything else in the account is ignored. */
async function isOurSubscription(subscription: Stripe.Subscription): Promise<boolean> {
  if (subscription.metadata?.user_id) return true;
  const customerId = idOf(subscription.customer);
  if (!customerId) return false;
  const { data } = await createAdminClient().from("stripe_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  return Boolean(data);
}

/** One payment row per subscription invoice (first payment and each renewal). */
async function recordInvoice(invoice: Stripe.Invoice, paid: boolean) {
  const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return; // not a subscription invoice
  const amount = paid ? invoice.amount_paid : invoice.amount_due;
  if (!invoice.id || amount <= 0) return; // nothing charged (e.g. a 100% coupon)

  const db = createAdminClient();
  // The invoice can arrive before customer.subscription.created; sync first so the row exists.
  const { data: known } = await db.from("subscriptions").select("id").eq("stripe_subscription_id", subscriptionId).maybeSingle();
  if (!known) {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    if (!(await isOurSubscription(subscription))) return;
    await syncSubscription(subscription);
  }

  const { error } = await db.rpc("record_stripe_invoice", {
    p_stripe_subscription_id: subscriptionId,
    p_stripe_invoice_id: invoice.id,
    p_amount_cents: amount,
    p_paid: paid,
    p_failure_reason: paid ? undefined : "invoice_payment_failed",
  });
  if (error) throw error;
  if (!paid) await subscriptionPaymentFailed(subscriptionId);
}

/** A refund made in the Stripe dashboard is recorded on the matching one-time payment. */
async function recordChargeRefund(charge: Stripe.Charge) {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId || charge.amount_refunded <= 0) return;
  const db = createAdminClient();
  const { data: payment } = await db.from("payments").select("id").eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();
  if (!payment) return; // e.g. a subscription invoice; the admin records those refunds by hand
  const { error } = await db.rpc("record_refund", { p_payment_id: payment.id, p_refunded_amount_cents: charge.amount_refunded });
  if (error) throw error;
}
