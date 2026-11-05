import "server-only";
import { listMyBookings } from "@/lib/consultations/queries";
import { listMyRegistrations } from "@/lib/events/queries";
import { routes } from "@/lib/routes";
import { listMySubscriptions, liveStatuses, type MySubscription } from "@/lib/subscriptions/queries";

/** A live membership waiting for the member to pay: a bank transfer to make, or a card payment that failed. */
const subscriptionNeedsPayment = (s: MySubscription) =>
  liveStatuses.includes(s.status) && (s.pendingPayment !== null || s.status === "past_due" || s.status === "incomplete");

/**
 * How many things in each profile section wait for the member, keyed by the section's link: upcoming
 * events and consultations that still need paying, and memberships with an open or failed payment.
 * The profile menu shows these as small badges.
 */
export async function getAccountAttention(): Promise<Record<string, number>> {
  const now = Date.now();
  const [registrations, bookings, subscriptions] = await Promise.all([
    listMyRegistrations(),
    listMyBookings(),
    listMySubscriptions(),
  ]);
  return {
    [routes.accountEvents]: registrations.filter(
      (r) => r.status === "pending_payment" && !!r.event && new Date(r.event.starts_at).getTime() > now,
    ).length,
    [routes.accountConsultations]: bookings.filter(
      (b) => b.status === "pending_payment" && new Date(b.ends_at).getTime() > now,
    ).length,
    [routes.accountSubscriptions]: subscriptions.filter(subscriptionNeedsPayment).length,
  };
}
