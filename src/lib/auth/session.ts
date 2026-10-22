import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginPath, routes } from "@/lib/routes";

/**
 * The signed-in user for this request, checked with the Supabase Auth server (not just the cookie), or null.
 * Cached per request, so a layout and its page share one lookup.
 */
export const getCurrentUser = cache(async () => {
  // Always render per request, even in a build without the Supabase variables.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

/**
 * The signed-in user and their profile, for account pages. Sends anyone else to the login page.
 * The proxy normally redirects first (keeping the exact page to return to); this is the check that counts.
 */
export const requireUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(routes.account));
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { user, profile };
});
