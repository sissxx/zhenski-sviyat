import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import type { QueryData } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicEvent, type PublicEvent } from "./types";

/**
 * Read-only event queries for the public pages and the account area. They use the visitor's own
 * Supabase client, so RLS decides what is visible (no drafts; only the user's own registrations).
 */

async function client() {
  // Event data changes all the time (seats, status), so these pages always render per request.
  await connection();
  return isSupabaseConfigured() ? createClient() : null;
}

/** Published events that haven't started yet, soonest first. */
export async function listUpcomingEvents(limit?: number): Promise<PublicEvent[]> {
  const supabase = await client();
  if (!supabase) return [];
  let query = supabase
    .from("event_listing")
    .select("*")
    .eq("status", "published")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("listUpcomingEvents", error);
    return [];
  }
  return data.map((row) => toPublicEvent(row));
}

/** Events that already happened, latest first. */
export async function listPastEvents(limit = 6): Promise<PublicEvent[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("event_listing")
    .select("*")
    .in("status", ["published", "completed"])
    .lte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listPastEvents", error);
    return [];
  }
  return data.map((row) => toPublicEvent(row));
}

/** One public event by slug, or null. Cached per request so metadata and the page share it. */
export const getEventBySlug = cache(async (slug: string): Promise<PublicEvent | null> => {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase.from("event_listing").select("*").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("getEventBySlug", error);
    return null;
  }
  return data ? toPublicEvent(data) : null;
});

const registrationColumns = `
  id, status, price_cents, payment_method, hold_expires_at, confirmed_at, cancelled_at, created_at,
  event:events (id, slug, title, starts_at, format, city, venue_name, venue_address, status, price_cents),
  payments (id, status, provider, amount_cents, bank_reference, expires_at, paid_at, created_at)
`;

type ServerClient = Awaited<ReturnType<typeof createClient>>;

const registrationsQuery = (supabase: ServerClient) => supabase.from("event_registrations").select(registrationColumns);

type RawRegistration = QueryData<ReturnType<typeof registrationsQuery>>[number];

async function myRegistrationsQuery() {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  return { query: registrationsQuery(supabase), user };
}

/** The signed-in user's live (pending or confirmed) registration for an event, or null. */
export async function getMyActiveRegistration(eventId: string) {
  const ctx = await myRegistrationsQuery();
  if (!ctx) return null;
  const { data, error } = await ctx.query
    .eq("event_id", eventId)
    .eq("user_id", ctx.user.id)
    .in("status", ["pending_payment", "confirmed"])
    .maybeSingle();
  if (error) console.error("getMyActiveRegistration", error);
  return data ? withLatestPayment(data) : null;
}

/** One of the signed-in user's registrations by id (RLS hides everyone else's), or null. */
export async function getMyRegistration(registrationId: string) {
  const ctx = await myRegistrationsQuery();
  if (!ctx) return null;
  const { data, error } = await ctx.query
    .eq("id", registrationId)
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (error) console.error("getMyRegistration", error);
  return data ? withLatestPayment(data) : null;
}

/** All of the signed-in user's registrations, newest first. */
export async function listMyRegistrations() {
  const ctx = await myRegistrationsQuery();
  if (!ctx) return [];
  const { data, error } = await ctx.query
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listMyRegistrations", error);
    return [];
  }
  return data.map(withLatestPayment);
}

/** Keeps the most recent payment, which is the one the user acts on. */
function withLatestPayment(row: RawRegistration) {
  const { payments, ...rest } = row;
  const payment = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  return { ...rest, payment };
}

export type MyRegistration = ReturnType<typeof withLatestPayment>;

/** Meeting link and instructions; RLS returns them only to confirmed attendees and admins. */
export async function getPrivateEventDetails(eventId: string) {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("event_private_details")
    .select("online_url, attendee_instructions")
    .eq("event_id", eventId)
    .maybeSingle();
  return data;
}

/** The association's bank account for transfers, from app_settings. Empty fields stay null. */
export async function getBankDetails() {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("app_settings")
    .select("bank_transfer_beneficiary, bank_transfer_iban, bank_transfer_bic, bank_transfer_bank_name")
    .maybeSingle();
  return data
    ? {
        beneficiary: data.bank_transfer_beneficiary,
        iban: data.bank_transfer_iban,
        bic: data.bank_transfer_bic,
        bankName: data.bank_transfer_bank_name,
      }
    : null;
}
