import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { formatTime, formatWeekdayDayMonth, sofiaDateKey } from "@/lib/locale";
import type { BookingRules, ConsultationService, ConsultationSlot } from "./types";

/**
 * Read-only consultation queries. They use the visitor's own Supabase client, so RLS decides what is
 * visible (active services and specialists; only the user's own bookings). Free slots come from the
 * `get_available_slots` database function, which applies working hours, time off, bookings and notice rules.
 */

async function client() {
  // Slots and bookings change all the time, so these pages always render per request.
  await connection();
  return isSupabaseConfigured() ? createClient() : null;
}

/** Active services with the active specialists who offer them, in admin sort order. */
export const listConsultationServices = cache(async (): Promise<ConsultationService[]> => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("consultation_types")
    .select(
      `id, slug, name, description, duration_minutes, location_info, requires_prepayment, allow_bank_transfer, price_cents,
       specialist_consultation_types (price_cents_override, specialists (id, slug, full_name, title, is_active, sort_order))`,
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("listConsultationServices", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    locationInfo: row.location_info,
    requiresPrepayment: row.requires_prepayment,
    allowBankTransfer: row.allow_bank_transfer,
    specialists: row.specialist_consultation_types
      .flatMap((link) => (link.specialists?.is_active ? [{ ...link.specialists, price: link.price_cents_override }] : []))
      .sort((a, b) => a.sort_order - b.sort_order || a.full_name.localeCompare(b.full_name, "bg"))
      .map((s) => ({ id: s.id, slug: s.slug, name: s.full_name, title: s.title, priceCents: s.price ?? row.price_cents })),
  }));
});

const defaultRules: BookingRules = { minNoticeHours: 24, maxAdvanceDays: 60, cancelDeadlineHours: 24, maxReschedules: 2 };

/** Booking window, cancel deadline and reschedule limit, as the admin set them. */
export const getBookingRules = cache(async (): Promise<BookingRules> => {
  const supabase = await client();
  if (!supabase) return defaultRules;
  const { data } = await supabase
    .from("app_settings")
    .select("consultation_min_notice_hours, consultation_max_advance_days, consultation_cancel_deadline_hours, consultation_max_reschedules")
    .maybeSingle();
  return data
    ? {
        minNoticeHours: data.consultation_min_notice_hours,
        maxAdvanceDays: data.consultation_max_advance_days,
        cancelDeadlineHours: data.consultation_cancel_deadline_hours,
        maxReschedules: data.consultation_max_reschedules,
      }
    : defaultRules;
});

/** "YYYY-MM-DD" plus `days`, as calendar arithmetic (no time zone involved). */
function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** The database function returns at most ~2 months per call. */
const CHUNK_DAYS = 60;

/**
 * Free start times for a service over the whole booking window, for the given specialists.
 * When several specialists are free at the same time, the first one in sort order gets the slot.
 */
export async function listFreeSlots(serviceId: string, specialistIds: string[]): Promise<ConsultationSlot[]> {
  const supabase = await client();
  if (!supabase || specialistIds.length === 0) return [];
  const { maxAdvanceDays } = await getBookingRules();
  const today = sofiaDateKey(new Date());
  const last = addDays(today, maxAdvanceDays);
  const ranges: [string, string][] = [];
  for (let from = today; from <= last; from = addDays(from, CHUNK_DAYS + 1)) {
    const to = addDays(from, CHUNK_DAYS);
    ranges.push([from, to < last ? to : last]);
  }

  const results = await Promise.all(
    specialistIds.flatMap((specialistId) =>
      ranges.map(async ([from, to]) => {
        const { data, error } = await supabase.rpc("get_available_slots", {
          p_specialist_id: specialistId,
          p_consultation_type_id: serviceId,
          p_from: from,
          p_to: to,
        });
        if (error) console.error("get_available_slots", error);
        return (data ?? []).map((slot) => ({ specialistId, startsAt: new Date(slot.starts_at).toISOString() }));
      }),
    ),
  );

  const byStart = new Map<string, ConsultationSlot>();
  for (const { specialistId, startsAt } of results.flat()) {
    const current = byStart.get(startsAt);
    if (current && specialistIds.indexOf(current.specialistId) <= specialistIds.indexOf(specialistId)) continue;
    byStart.set(startsAt, {
      startsAt,
      specialistId,
      dateKey: sofiaDateKey(startsAt),
      dayLabel: formatWeekdayDayMonth(startsAt),
      timeLabel: formatTime(startsAt),
    });
  }
  return [...byStart.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

const bookingColumns = `
  id, status, starts_at, ends_at, price_cents, payment_method, hold_expires_at, user_note, reschedule_count,
  cancelled_at, created_at,
  specialist:specialists (id, slug, full_name, title),
  service:consultation_types (id, slug, name, duration_minutes, location_info, requires_prepayment, allow_bank_transfer),
  payments (id, status, provider, amount_cents, bank_reference, expires_at, paid_at, created_at)
`;

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const bookingsQuery = (supabase: ServerClient) => supabase.from("consultation_bookings").select(bookingColumns);

type RawBooking = QueryData<ReturnType<typeof bookingsQuery>>[number];

async function myBookingsQuery() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  return { query: bookingsQuery(supabase), user };
}

/** One of the signed-in user's bookings by id (RLS hides everyone else's), or null. */
export async function getMyBooking(bookingId: string) {
  const ctx = await myBookingsQuery();
  if (!ctx) return null;
  const { data, error } = await ctx.query.eq("id", bookingId).eq("user_id", ctx.user.id).maybeSingle();
  if (error) console.error("getMyBooking", error);
  return data ? withLatestPayment(data) : null;
}

/** All of the signed-in user's bookings, latest appointment first. */
export async function listMyBookings() {
  const ctx = await myBookingsQuery();
  if (!ctx) return [];
  const { data, error } = await ctx.query.eq("user_id", ctx.user.id).order("starts_at", { ascending: false });
  if (error) {
    console.error("listMyBookings", error);
    return [];
  }
  return data.map(withLatestPayment);
}

/** Keeps the most recent payment, which is the one the user acts on. */
function withLatestPayment(row: RawBooking) {
  const { payments, ...rest } = row;
  const payment = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  return { ...rest, payment };
}

export type MyBooking = ReturnType<typeof withLatestPayment>;

/**
 * What the user may still do with a booking under the admin's rules (the database checks again):
 * cancel a pending one any time and a confirmed one until the deadline; move a confirmed one until the
 * deadline and within the reschedule limit.
 */
export function bookingActions(booking: Pick<MyBooking, "status" | "starts_at" | "reschedule_count">, rules: BookingRules, now = Date.now()) {
  const startsAt = new Date(booking.starts_at).getTime();
  const beforeDeadline = startsAt - rules.cancelDeadlineHours * 3600_000 > now;
  const upcoming = startsAt > now;
  const confirmed = booking.status === "confirmed";
  return {
    canCancel: upcoming && (booking.status === "pending_payment" || (confirmed && beforeDeadline)),
    canReschedule: upcoming && confirmed && beforeDeadline && booking.reschedule_count < rules.maxReschedules,
    pastDeadline: upcoming && confirmed && !beforeDeadline,
  };
}
