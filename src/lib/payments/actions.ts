"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginPath, routes } from "@/lib/routes";
import { isStripeConfigured } from "@/lib/stripe/server";
import { redirectToCheckout } from "./checkout-redirect";
import { cardUnavailable, type CheckoutTarget } from "./paths";


/**
 * Sends the user to Stripe Checkout for a pending card payment, e.g. "Плати с карта" on a confirmation
 * page after they left Checkout. Reuses the open session when there is one.
 */
export async function continueCardPayment(paymentId: string): Promise<{ ok: false; error: string }> {
  if (!z.uuid().safeParse(paymentId).success || !isStripeConfigured()) return { ok: false, error: cardUnavailable };
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(routes.account));

  // RLS: users only see their own payments.
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("id, event_registration_id, consultation_booking_id, event_registrations(events(slug))")
    .eq("id", paymentId)
    .maybeSingle();
  const slug = payment?.event_registrations?.events?.slug;
  const target: CheckoutTarget | null = payment?.consultation_booking_id
    ? { bookingId: payment.consultation_booking_id }
    : payment?.event_registration_id && slug
      ? { eventSlug: slug, registrationId: payment.event_registration_id }
      : null;
  if (!target) return { ok: false, error: "Плащането не е намерено." };

  return redirectToCheckout(paymentId, user.id, target);
}
