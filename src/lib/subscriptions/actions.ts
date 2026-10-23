"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db-errors";
import { notifyLater, notifySubscriptionBankTransfer } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginPath, routes } from "@/lib/routes";
import { cardUnavailable } from "@/lib/payments/paths";
import { startSubscriptionCheckout, syncSubscriptionById } from "@/lib/stripe/checkout";
import { isStripeConfigured, stripe } from "@/lib/stripe/server";
import { liveStatuses } from "./queries";
import { viberRequestSchema, type ViberRequestValues } from "./schemas";

/**
 * Starting and stopping memberships. By card: Stripe Checkout in subscription mode, renewed by Stripe
 * every month; the webhook keeps the subscriptions table in step. By bank transfer:
 * start_bank_transfer_subscription, with each period confirmed by an admin.
 */

export type SubscriptionActionResult = { ok: true } | { ok: false; error: string };

const notConnected = { ok: false, error: "Членствата все още не са свързани със сървъра. Опитай отново по-късно." } as const;
const notFound = { ok: false, error: "Абонаментът не е намерен." } as const;

async function signedIn() {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(routes.accountSubscriptions));
  return user;
}

export async function subscribeByCard(planId: string): Promise<SubscriptionActionResult> {
  if (!z.uuid().safeParse(planId).success) return { ok: false, error: dbErrorMessage({ code: "P0001", message: "plan_not_found" }) };
  if (!isSupabaseConfigured()) return notConnected;
  if (!isStripeConfigured()) return { ok: false, error: cardUnavailable };
  const user = await signedIn();

  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("membership_plans")
    .select("id, name, price_cents, billing_interval, stripe_product_id, stripe_price_id")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();
  if (!plan) return { ok: false, error: dbErrorMessage({ code: "P0001", message: "plan_not_found" }) };

  const { data: live } = await supabase
    .from("subscriptions")
    .select("id, provider, status")
    .eq("user_id", user.id)
    .eq("plan_id", planId)
    .in("status", liveStatuses)
    .maybeSingle();
  if (live?.provider === "stripe" || live?.status === "active") {
    return {
      ok: false,
      error:
        live.provider === "stripe"
          ? dbErrorMessage({ code: "P0001", message: "already_subscribed" })
          : "Членството ти е платено по банков път. Когато наближи краят му, можеш да го подновиш с превод.",
    };
  }

  let url: string;
  try {
    if (live?.status === "pending_bank_transfer") {
      // Switching from an unpaid bank-transfer request to card: drop the request so the card subscription
      // can take its place (one live subscription per plan).
      const admin = createAdminClient();
      const { data: pending } = await admin.from("payments").select("id").eq("subscription_id", live.id).eq("status", "pending");
      for (const payment of pending ?? []) {
        const { error } = await admin.rpc("mark_payment_failed", {
          p_payment_id: payment.id,
          p_status: "cancelled",
          p_reason: "switched_to_card",
        });
        if (error) throw error;
      }
    }
    url = await startSubscriptionCheckout(plan, user.id, routes.accountSubscriptions);
  } catch (error) {
    unstable_rethrow(error);
    console.error("subscribeByCard", error);
    return { ok: false, error: cardUnavailable };
  }
  redirect(url);
}

export async function subscribeByBankTransfer(planId: string): Promise<SubscriptionActionResult> {
  if (!z.uuid().safeParse(planId).success) return { ok: false, error: dbErrorMessage({ code: "P0001", message: "plan_not_found" }) };
  if (!isSupabaseConfigured()) return notConnected;
  await signedIn();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_bank_transfer_subscription", { p_plan_id: planId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const started = data?.[0];
  if (!started) return { ok: false, error: dbErrorMessage(null) };

  notifyLater(() => notifySubscriptionBankTransfer(started.payment_id));
  revalidatePath(routes.accountSubscriptions);
  redirect(`${routes.accountSubscriptions}?prevod=${started.subscription_id}`);
}

/** Stops a card subscription at the end of the paid month, or undoes that while the month lasts. */
export async function setCardSubscriptionCancelled(subscriptionId: string, cancel: boolean): Promise<SubscriptionActionResult> {
  if (!z.uuid().safeParse(subscriptionId).success) return notFound;
  if (!isSupabaseConfigured()) return notConnected;
  if (!isStripeConfigured()) return { ok: false, error: cardUnavailable };
  const user = await signedIn();

  // RLS: only the user's own subscription comes back.
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, provider, status")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!subscription?.stripe_subscription_id || subscription.provider !== "stripe") return notFound;
  if (!["active", "trialing", "past_due"].includes(subscription.status)) {
    return { ok: false, error: "Този абонамент вече не е активен." };
  }

  try {
    await stripe().subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: cancel });
    await syncSubscriptionById(subscription.stripe_subscription_id);
  } catch (error) {
    console.error("setCardSubscriptionCancelled", error);
    return { ok: false, error: "Промяната не беше записана. Опитай отново след малко." };
  }
  revalidatePath(routes.accountSubscriptions);
  return { ok: true };
}

/** The member tells the team which Viber number to add to a group their membership opens. */
export async function requestViberAccess(groupId: string, values: ViberRequestValues): Promise<SubscriptionActionResult> {
  if (!z.uuid().safeParse(groupId).success) return { ok: false, error: dbErrorMessage({ code: "P0001", message: "not_eligible" }) };
  const parsed = viberRequestSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? dbErrorMessage(null) };
  if (!isSupabaseConfigured()) return notConnected;
  await signedIn();

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_viber_access", {
    p_viber_group_id: groupId,
    p_viber_phone: parsed.data.phone,
    p_viber_display_name: parsed.data.displayName || undefined,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath(routes.accountSubscriptions);
  return { ok: true };
}
