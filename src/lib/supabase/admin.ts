import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

/**
 * Supabase client with the secret key. It bypasses RLS, so use it only for trusted server work:
 * Stripe webhooks, cron (run_maintenance) and the contact form. Never for code that acts for a visitor.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing environment variable SUPABASE_SECRET_KEY.");
  }
  // A publishable or anon key here would not fail: it would quietly see nothing behind RLS.
  if (!isSecretKey(secretKey)) {
    throw new Error("SUPABASE_SECRET_KEY is not a secret key (expected sb_secret_..., or the legacy service_role key).");
  }

  return createClient<Database>(supabaseUrl(), secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** sb_secret_... or a legacy service_role JWT; never the publishable / anon key. */
export function isSecretKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  if (key.startsWith("sb_publishable_")) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString("utf8"));
    return payload?.role === "service_role";
  } catch {
    return false;
  }
}
