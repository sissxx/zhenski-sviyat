import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** Refreshes the Supabase session cookie on each request. Called from src/proxy.ts. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Public pages work without Supabase, so a missing config shouldn't take the whole site down.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return response;
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
  await supabase.auth.getClaims();

  return response;
}
