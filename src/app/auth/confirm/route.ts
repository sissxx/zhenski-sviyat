import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { routes, safeNextPath } from "@/lib/routes";

const otpTypes: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Email templates pass {{ .RedirectTo }}, which is our own emailRedirectTo: a full URL whose own `next` is the page
 * to continue to. Unwrap that; anything on another origin is dropped.
 */
function sameSitePath(value: string | null, origin: string): string | null {
  if (!value || value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    if (url.origin !== origin) return null;
    return url.pathname === routes.authConfirm ? url.searchParams.get("next") : url.pathname + url.search;
  } catch {
    return null;
  }
}

/**
 * Landing point for links in Supabase emails (sign-up confirmation, password reset, email change).
 * Handles both link styles: `token_hash` + `type` from a custom email template, and `code` from the
 * default template's PKCE redirect. Either way the user ends up signed in and continues to `next`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const code = params.get("code");
  const fallback = type === "recovery" ? routes.newPassword : `${routes.account}?potvarden=1`;
  const next = safeNextPath(sameSitePath(params.get("next"), request.nextUrl.origin), fallback);

  const failed = () => NextResponse.redirect(new URL(`${routes.login}?greshka=link`, request.url));
  if (!isSupabaseConfigured()) return failed();

  const supabase = await createClient();
  let ok = false;
  if (tokenHash && type && otpTypes.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  return ok ? NextResponse.redirect(new URL(next, request.url)) : failed();
}
