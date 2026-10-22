import "server-only";
import Stripe from "stripe";

/**
 * Stripe client and settings. Card payments need STRIPE_SECRET_KEY and, because the server records
 * Checkout sessions on payments, SUPABASE_SECRET_KEY. Until both are set, card options show as "скоро".
 *
 * Only test keys (sk_test_ / rk_test_) are used unless STRIPE_ALLOW_LIVE=true, so a live key pasted by
 * mistake can't take real money before the launch checklist is done (docs/payments.md).
 */

let client: Stripe | null = null;

function secretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const live = key.startsWith("sk_live_") || key.startsWith("rk_live_");
  if (live && process.env.STRIPE_ALLOW_LIVE !== "true") {
    console.error("STRIPE_SECRET_KEY is a live key but STRIPE_ALLOW_LIVE is not true; card payments are off.");
    return null;
  }
  return key;
}

/** True when card payments can be offered. */
export function isStripeConfigured(): boolean {
  return Boolean(secretKey() && process.env.SUPABASE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = secretKey();
  if (!key) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY).");
  // The SDK pins the API version it was built for, so webhook payloads match these types.
  client ??= new Stripe(key, { appInfo: { name: "zhenski-sviyat" }, maxNetworkRetries: 2 });
  return client;
}

export function webhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}

/** Id of an expandable Stripe field, whether it came back expanded or not. */
export const idOf = (value: string | { id: string } | null | undefined): string | null =>
  value == null ? null : typeof value === "string" ? value : value.id;

/** Stripe timestamps are Unix seconds; the database wants ISO strings. */
export const isoFromUnix = (seconds: number | null | undefined): string | undefined =>
  seconds == null ? undefined : new Date(seconds * 1000).toISOString();
