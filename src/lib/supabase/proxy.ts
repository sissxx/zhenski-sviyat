import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { guestOnlyPaths, loginPath, protectedPrefixes, routes, safeNextPath } from "@/lib/routes";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./env";

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Refreshes the Supabase session cookie on each request (called from src/proxy.ts), sends visitors who aren't
 * signed in from account pages to the login page, and sends signed-in users past the login and sign-up pages.
 * Account pages check the user again on the server: this redirect is for convenience, not the security boundary.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) => matches(pathname, prefix));

  // Public pages work without Supabase, so a missing config shouldn't take the whole site down.
  if (!isSupabaseConfigured()) {
    return isProtected ? NextResponse.redirect(new URL(loginPath(pathname + search), request.url)) : response;
  }

  const supabase = createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Don't add code between createServerClient and getClaims: it validates the token and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  let redirectTo: string | null = null;
  if (isProtected && !signedIn) {
    redirectTo = loginPath(pathname + search);
  } else if (signedIn && guestOnlyPaths.includes(pathname)) {
    // "Стани член" on a plan page links to sign-up with ?plan=; a member already has an account.
    const fallback = request.nextUrl.searchParams.has("plan") ? routes.accountSubscriptions : routes.account;
    redirectTo = safeNextPath(request.nextUrl.searchParams.get("next"), fallback);
  }
  if (!redirectTo) return response;

  // Carry over any refreshed session cookies, or the browser keeps the old token.
  const redirect = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
