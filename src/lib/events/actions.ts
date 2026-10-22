"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isStripeConfigured } from "@/lib/stripe/server";
import { expireOpenCheckout } from "@/lib/stripe/checkout";
import { redirectToCheckout } from "@/lib/payments/checkout-redirect";
import { cardUnavailable } from "@/lib/payments/paths";
import { eventConfirmationPath, loginPath, eventRegistrationPath, routes } from "@/lib/routes";
import { getEventBySlug } from "./queries";

/**
 * Event sign-up and cancellation. The database functions check everything again (window, seats,
 * duplicates, price), so these actions only validate the input and translate errors to Bulgarian.
 */

export type EventActionResult = { ok: true } | { ok: false; error: string };

const notConnected = { ok: false, error: "Записването все още не е свързано със сървъра. Опитай отново по-късно." } as const;

const registerSchema = z.object({
  slug: z.string().min(1).max(200),
  paymentMethod: z.enum(["card", "bank"]).optional(),
});

export async function registerForEvent(input: z.infer<typeof registerSchema>): Promise<EventActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Моля, провери въведените данни." };
  if (!isSupabaseConfigured()) return notConnected;

  const { slug, paymentMethod } = parsed.data;
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(eventRegistrationPath(slug)));

  const event = await getEventBySlug(slug);
  if (!event) return { ok: false, error: dbErrorMessage({ code: "P0001", message: "event_not_found" }) };

  const paid = event.priceCents > 0;
  if (paid && !paymentMethod) return { ok: false, error: "Избери начин на плащане." };
  if (paid && paymentMethod === "card" && !isStripeConfigured()) return { ok: false, error: cardUnavailable };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: event.id,
    ...(paid ? { p_payment_method: paymentMethod === "card" ? ("stripe" as const) : ("bank_transfer" as const) } : {}),
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  const registration = data?.[0];
  if (!registration) return { ok: false, error: dbErrorMessage(null) };

  revalidatePath(routes.accountEvents);
  // Card: on to Stripe Checkout. An unfinished bank-transfer sign-up comes back as it was and goes to
  // its confirmation page with the transfer details.
  if (paid && paymentMethod === "card" && registration.payment_id) {
    return redirectToCheckout(registration.payment_id, user.id, { eventSlug: slug, registrationId: registration.registration_id });
  }
  redirect(`${eventConfirmationPath(slug)}?zapisvane=${registration.registration_id}`);
}

export async function cancelEventRegistration(registrationId: string): Promise<EventActionResult> {
  if (!z.uuid().safeParse(registrationId).success) return { ok: false, error: "Записването не е намерено." };
  if (!isSupabaseConfigured()) return notConnected;

  const supabase = await createClient();
  const { data: openCard } = await supabase
    .from("payments")
    .select("id")
    .eq("event_registration_id", registrationId)
    .eq("provider", "stripe")
    .eq("status", "pending")
    .maybeSingle();
  const { error } = await supabase.rpc("cancel_event_registration", { p_registration_id: registrationId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  // Close the Checkout page too, so nobody pays for a seat that was just given up.
  if (openCard && isStripeConfigured()) await expireOpenCheckout(openCard.id);

  revalidatePath(routes.accountEvents);
  return { ok: true };
}
