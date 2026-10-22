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

  return createClient<Database>(supabaseUrl(), secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
