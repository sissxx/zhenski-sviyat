import "server-only";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import type { Database } from "@/lib/supabase/database.types";
import { fallbackPlans, toPublicPlans, type PublicPlan } from "./plans";

/**
 * Plans and the signed-in user's subscriptions for the account area. The user's own Supabase client,
 * so RLS shows only active plans and the user's own rows.
 */

export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

/** Statuses that block a second subscription to the same plan (matches subscriptions_one_live_idx). */
export const liveStatuses: SubscriptionStatus[] = ["pending_bank_transfer", "incomplete", "trialing", "active", "past_due"];

export async function listActivePlans() {
  await connection();
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("id, slug, name, description, features, price_cents, billing_interval, allow_bank_transfer")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("listActivePlans", error);
    return [];
  }
  return data;
}

export type ActivePlan = Awaited<ReturnType<typeof listActivePlans>>[number];

/**
 * Plans for the public "Членство" page, with the Viber groups each one opens. Until an admin creates plans
 * (or when the database can't be reached) the two plans from src/content/plans.ts are shown instead, marked
 * `fromContent` so the page can say online sign-up isn't open yet.
 */
export async function listPublicPlans(): Promise<{ plans: PublicPlan[]; fromContent: boolean }> {
  await connection();
  if (!isSupabaseConfigured()) return { plans: fallbackPlans(), fromContent: true };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select(
      "id, slug, name, description, features, price_cents, billing_interval, allow_bank_transfer, plan_viber_groups (viber_groups (name, is_active))",
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) console.error("listPublicPlans", error);
  if (error || data.length === 0) return { plans: fallbackPlans(), fromContent: true };
  return { plans: toPublicPlans(data), fromContent: false };
}

export type MyViberGroup = Database["public"]["Functions"]["my_viber_groups"]["Returns"][number];

/** Viber groups the signed-in user's active memberships open, with invite links (empty after a lapse). */
export async function listMyViberGroups(): Promise<MyViberGroup[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_viber_groups");
  if (error) {
    console.error("listMyViberGroups", error);
    return [];
  }
  return data ?? [];
}

export async function listMySubscriptions() {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, plan_id, provider, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, ended_at, created_at, plan:membership_plans (name, slug, price_cents, billing_interval), payments (id, status, provider, amount_cents, bank_reference, expires_at, created_at)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listMySubscriptions", error);
    return [];
  }
  return data.map(({ payments, ...rest }) => ({
    ...rest,
    pendingPayment: payments.filter((p) => p.status === "pending").sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null,
  }));
}

export type MySubscription = Awaited<ReturnType<typeof listMySubscriptions>>[number];

export async function getSubscriptionSettings() {
  if (!isSupabaseConfigured()) return { allowBankTransfer: false, renewalWindowDays: 14 };
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("subscriptions_allow_bank_transfer, subscription_renewal_window_days")
    .maybeSingle();
  return {
    allowBankTransfer: data?.subscriptions_allow_bank_transfer ?? false,
    renewalWindowDays: data?.subscription_renewal_window_days ?? 14,
  };
}

/** A bank-transfer member may pay the next period from `renewalWindowDays` before the current one ends. */
export function bankRenewalOpen(s: MySubscription, renewalWindowDays: number, now = Date.now()): boolean {
  return (
    s.provider === "bank_transfer" &&
    s.status === "active" &&
    !s.pendingPayment &&
    s.current_period_end !== null &&
    new Date(s.current_period_end).getTime() - renewalWindowDays * 86_400_000 <= now
  );
}
