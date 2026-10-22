"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AdminResult } from "@/lib/admin/actions";
import { adminErrorMessage, genericAdminError } from "@/lib/admin/errors";
import { notifyConsultationCancelled, notifyLater } from "@/lib/email/notifications";
import { availabilityRows, availabilitySchema, timeOffRow, timeOffSchema, type AvailabilityInput, type TimeOffInput } from "@/lib/admin/schedule";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";
import { getMySpecialist } from "./session";

/**
 * Actions on a specialist's own schedule and bookings. Each one works only on the caller's linked specialist
 * profile; RLS and the database functions check the same again (spec 12.2).
 */

type Supabase = Awaited<ReturnType<typeof createClient>>;
type DbError = { code?: string; message?: string } | null;

const invalidInput: AdminResult = { ok: false, error: "Моля, провери въведените данни." };
const uuid = z.uuid();

async function run(work: (supabase: Supabase, specialistId: string) => Promise<DbError>): Promise<AdminResult> {
  try {
    const specialist = await getMySpecialist();
    if (!specialist) return { ok: false, error: adminErrorMessage({ message: "forbidden" }) };
    const error = await work(await createClient(), specialist.id);
    if (error) return { ok: false, error: adminErrorMessage(error) };
    revalidatePath(routes.accountSpecialist);
    revalidatePath(routes.consultations);
    return { ok: true };
  } catch (error) {
    console.error("specialist action failed", error);
    return { ok: false, error: genericAdminError };
  }
}

/** The first argument mirrors the admin action's signature for the shared form; the caller's own profile is used. */
export async function addMyAvailability(_specialistId: string, input: AvailabilityInput): Promise<AdminResult> {
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) return invalidInput;
  return run(async (supabase, id) => (await supabase.from("specialist_availability").insert(availabilityRows(id, parsed.data))).error);
}

export async function deleteMyAvailability(availabilityId: string): Promise<AdminResult> {
  if (!uuid.safeParse(availabilityId).success) return invalidInput;
  return run(async (supabase, id) => (await supabase.from("specialist_availability").delete().eq("id", availabilityId).eq("specialist_id", id)).error);
}

export async function addMyTimeOff(_specialistId: string, input: TimeOffInput): Promise<AdminResult> {
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return invalidInput;
  return run(async (supabase, id) => (await supabase.from("specialist_time_off").insert(timeOffRow(id, parsed.data))).error);
}

export async function deleteMyTimeOff(timeOffId: string): Promise<AdminResult> {
  if (!uuid.safeParse(timeOffId).success) return invalidInput;
  return run(async (supabase, id) => (await supabase.from("specialist_time_off").delete().eq("id", timeOffId).eq("specialist_id", id)).error);
}

/** Cancels one of the specialist's bookings, with the reason the client will see. No deadline applies to staff. */
export async function cancelMyBooking(bookingId: string, reason: string): Promise<AdminResult> {
  if (!uuid.safeParse(bookingId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("cancel_consultation", {
      p_booking_id: bookingId,
      p_reason: reason.trim().slice(0, 500) || "Отказано от специалиста",
    });
    if (!error) notifyLater(() => notifyConsultationCancelled(bookingId));
    return error;
  });
}

export async function setMyBookingOutcome(bookingId: string, status: "completed" | "no_show"): Promise<AdminResult> {
  if (!uuid.safeParse(bookingId).success || !["completed", "no_show"].includes(status)) return invalidInput;
  return run(async (supabase) => (await supabase.rpc("set_booking_outcome", { p_booking_id: bookingId, p_status: status })).error);
}
