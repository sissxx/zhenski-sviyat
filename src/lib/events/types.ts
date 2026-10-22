import type { Database } from "@/lib/supabase/database.types";
import { formatPrice } from "@/lib/locale";

type ListingRow = Database["public"]["Views"]["event_listing"]["Row"];
export type EventFormat = Database["public"]["Enums"]["event_format"];
export type RegistrationStatus = Database["public"]["Enums"]["registration_status"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentProvider = Database["public"]["Enums"]["payment_provider"];

/**
 * Where an event stands for a visitor right now:
 * open for sign-up, full, sign-up not open yet, sign-up closed, already happened, or cancelled.
 */
export type EventAvailability = "open" | "full" | "not_open_yet" | "closed" | "past" | "cancelled";

/** An event as the public pages show it, from the `event_listing` view. Dates are UTC ISO strings. */
export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  format: EventFormat;
  venueName: string | null;
  venueAddress: string | null;
  city: string | null;
  priceCents: number;
  capacity: number | null;
  seatsLeft: number | null;
  allowBankTransfer: boolean;
  registrationOpensAt: string | null;
  availability: EventAvailability;
};

function availabilityOf(row: ListingRow, now: number): EventAvailability {
  if (row.status === "cancelled") return "cancelled";
  if (row.status === "completed" || new Date(row.starts_at!).getTime() <= now) return "past";
  if (row.is_full) return "full";
  if (row.registration_opens_at && new Date(row.registration_opens_at).getTime() > now) return "not_open_yet";
  return row.registration_open ? "open" : "closed";
}

/** Maps a view row (every column nullable in the generated types) to the page model. */
export function toPublicEvent(row: ListingRow, now: number = Date.now()): PublicEvent {
  return {
    id: row.id!,
    slug: row.slug!,
    title: row.title!,
    summary: row.summary,
    description: row.description,
    startsAt: row.starts_at!,
    endsAt: row.ends_at,
    format: row.format ?? "in_person",
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    city: row.city,
    priceCents: row.price_cents ?? 0,
    capacity: row.capacity,
    seatsLeft: row.seats_left,
    allowBankTransfer: row.allow_bank_transfer ?? false,
    registrationOpensAt: row.registration_opens_at,
    availability: availabilityOf(row, now),
  };
}

type Placed = { format: EventFormat; city: string | null };

/** "София · присъствено", "Онлайн", "София · на живо и онлайн" */
export function eventLocationLabel(event: Placed): string {
  if (event.format === "online") return "Онлайн";
  const city = event.city ?? "Мястото предстои";
  return event.format === "hybrid" ? `${city} · на живо и онлайн` : `${city} · присъствено`;
}

export const eventPriceLabel = (event: { priceCents: number }) =>
  event.priceCents === 0 ? "Безплатно" : formatPrice(event.priceCents);

/** Short status for cards and badges; null when the event is simply open. */
export const availabilityLabels: Record<EventAvailability, string | null> = {
  open: null,
  full: "Няма свободни места",
  not_open_yet: "Записването предстои",
  closed: "Записването приключи",
  past: "Отминало",
  cancelled: "Отменено",
};

export const registrationStatusLabels: Record<RegistrationStatus, string> = {
  confirmed: "Потвърдено",
  pending_payment: "Чака плащане",
  cancelled: "Отказано",
  expired: "Изтекло",
};
