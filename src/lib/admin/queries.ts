import "server-only";
import type { requireAdminPage } from "./session";

type Supabase = Awaited<ReturnType<typeof requireAdminPage>>["supabase"];

/** Everyone registered for an event, with contact data and payment, newest first. */
export async function eventParticipants(supabase: Supabase, eventId: string) {
  const { data } = await supabase
    .from("event_registrations")
    .select(
      "id, status, price_cents, payment_method, hold_expires_at, confirmed_at, cancelled_at, cancellation_reason, checked_in_at, created_at, profiles!event_registrations_user_id_fkey(first_name, last_name, email, phone), payments(status, provider, bank_reference, needs_review)",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type Participant = Awaited<ReturnType<typeof eventParticipants>>[number];
