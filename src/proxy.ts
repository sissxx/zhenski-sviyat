import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the Stripe webhook (no user session there).
  matcher: ["/((?!_next/static|_next/image|api/stripe/|brand/|icon.svg|apple-icon.png|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
