"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/admin/session";
import { listMyBookings } from "@/lib/consultations/queries";
import { listMyRegistrations } from "@/lib/events/queries";
import { isStripeConfigured, stripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountResult = { ok: false; error: string };

/**
 * Deletes the signed-in member's account ("Изтрий профила" in Моите данни).
 *
 * Deleting the login removes the profile and, through the database's cascades, the member's sign-ups,
 * bookings, subscriptions and Viber access. Payment records stay for accounting (their user becomes empty),
 * as the privacy policy says. Card subscriptions are stopped by deleting the member's Stripe customer.
 *
 * Refused while something is still upcoming, so a seat or a specialist's hour is never dropped silently:
 * the member cancels those first (which tells the specialist and handles refunds as usual).
 */
export async function deleteMyAccount(confirmEmail: string): Promise<DeleteAccountResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/vhod");
  if (!user.email || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: "Въведи имейла на профила си, за да потвърдиш." };
  }
  if (await isCurrentUserAdmin()) {
    return { ok: false, error: "Профилът е администраторски. Помоли друг администратор да премахне правата ти, преди да го изтриеш." };
  }

  const now = Date.now();
  const [registrations, bookings] = await Promise.all([listMyRegistrations(), listMyBookings()]);
  const upcomingEvents = registrations.filter(
    (r) => (r.status === "confirmed" || r.status === "pending_payment") && !!r.event && new Date(r.event.starts_at).getTime() > now,
  );
  const upcomingBookings = bookings.filter(
    (b) => (b.status === "confirmed" || b.status === "pending_payment") && new Date(b.ends_at).getTime() > now,
  );
  if (upcomingEvents.length + upcomingBookings.length > 0) {
    return {
      ok: false,
      error: "Имаш предстоящи записвания. Откажи ги първо от „Моите записвания“ или ни пиши, ако вече е късно за отказ.",
    };
  }

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "В момента профилът не може да бъде изтрит. Пиши ни и ще го изтрием ние." };
  }

  // Stop card subscriptions: deleting the Stripe customer cancels all of them at once.
  const { data: customer } = await db.from("stripe_customers").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (customer && isStripeConfigured()) {
    try {
      await stripe().customers.del(customer.stripe_customer_id);
    } catch (error) {
      console.error("deleteMyAccount: Stripe customer not deleted", error);
      return { ok: false, error: "Не успяхме да спрем абонамента ти с карта. Опитай пак след малко или ни пиши." };
    }
  }

  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("deleteMyAccount", error);
    return { ok: false, error: "Профилът не беше изтрит. Опитай пак след малко или ни пиши." };
  }

  // The session belongs to a user that no longer exists; clear its cookies.
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/vhod?profil=iztrit");
}
