"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { eurosToCents, type FormValues } from "./convert";
import { deleteEntity as deleteRow, writeEntity } from "./entities";
import { adminErrorMessage, genericAdminError } from "./errors";
import { entityForms, type EntityKey } from "./forms";
import { availabilityRows, availabilitySchema, timeOffRow, timeOffSchema, type AvailabilityInput, type TimeOffInput } from "./schedule";
import { AdminAccessError, requireAdminAction } from "./session";

/**
 * Server actions behind the admin panel. Each one checks that the caller is an admin, validates its input,
 * and runs as that admin, so RLS and the database functions check the write again.
 */

export type AdminResult = { ok: true; id?: string } | { ok: false; error: string };

type Supabase = Awaited<ReturnType<typeof requireAdminAction>>["supabase"];
type DbError = { code?: string; message?: string } | null;

const invalidInput: AdminResult = { ok: false, error: "Моля, провери въведените данни." };
const uuid = z.uuid();

async function run(work: (supabase: Supabase, userId: string) => Promise<DbError | AdminResult>): Promise<AdminResult> {
  try {
    const { supabase, user } = await requireAdminAction();
    const result = await work(supabase, user.id);
    if (result && "ok" in result) return result;
    if (result) return { ok: false, error: adminErrorMessage(result) };
    // Public pages read the same tables, so refresh everything that may show the change.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof AdminAccessError) return { ok: false, error: adminErrorMessage({ message: "forbidden" }) };
    console.error("admin action failed", error);
    return { ok: false, error: genericAdminError };
  }
}

// --- Generic editors --------------------------------------------------------------------------------------

export async function saveEntity(key: Exclude<EntityKey, "settings">, id: string | null, values: FormValues): Promise<AdminResult> {
  const form = entityForms[key];
  if (!form || (id !== null && !uuid.safeParse(id).success)) return invalidInput;
  if (!form.schema.safeParse(values).success) return invalidInput;
  let savedId: string | undefined;
  const result = await run(async (supabase) => {
    const { error, id: newId } = await writeEntity(supabase, key, id, values);
    savedId = newId ?? undefined;
    return error;
  });
  return result.ok ? { ok: true, id: savedId } : result;
}

export async function deleteEntity(key: Exclude<EntityKey, "settings">, id: string): Promise<AdminResult> {
  if (!entityForms[key] || !uuid.safeParse(id).success) return invalidInput;
  return run(async (supabase) => (await deleteRow(supabase, key, id)).error);
}

export async function saveSettings(values: FormValues): Promise<AdminResult> {
  if (!entityForms.settings.schema.safeParse(values).success) return invalidInput;
  return run(async (supabase) => {
    const number = (key: string) => Number(values[key]);
    const textOrNull = (key: string) => (String(values[key] ?? "").trim() === "" ? null : String(values[key]).trim());
    const { error } = await supabase
      .from("app_settings")
      .update({
        consultation_max_advance_days: number("consultation_max_advance_days"),
        consultation_min_notice_hours: number("consultation_min_notice_hours"),
        consultation_cancel_deadline_hours: number("consultation_cancel_deadline_hours"),
        consultation_max_reschedules: number("consultation_max_reschedules"),
        consultation_slot_step_minutes: number("consultation_slot_step_minutes"),
        event_cancel_deadline_hours: number("event_cancel_deadline_hours"),
        checkout_hold_minutes: number("checkout_hold_minutes"),
        bank_transfer_hold_days: number("bank_transfer_hold_days"),
        subscriptions_allow_bank_transfer: values.subscriptions_allow_bank_transfer === true,
        subscription_renewal_window_days: number("subscription_renewal_window_days"),
        subscription_past_due_grace_days: number("subscription_past_due_grace_days"),
        bank_transfer_beneficiary: textOrNull("bank_transfer_beneficiary"),
        bank_transfer_iban: textOrNull("bank_transfer_iban")?.toUpperCase().replace(/\s+/g, "") ?? null,
        bank_transfer_bic: textOrNull("bank_transfer_bic")?.toUpperCase() ?? null,
        bank_transfer_bank_name: textOrNull("bank_transfer_bank_name"),
      })
      .eq("id", true);
    return error;
  });
}

// --- Events -----------------------------------------------------------------------------------------------

export async function cancelRegistration(registrationId: string, reason: string): Promise<AdminResult> {
  if (!uuid.safeParse(registrationId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("cancel_event_registration", {
      p_registration_id: registrationId,
      p_reason: reason.trim().slice(0, 500) || "Отказано от администратор",
    });
    return error;
  });
}

export async function setCheckedIn(registrationId: string, checkedIn: boolean): Promise<AdminResult> {
  if (!uuid.safeParse(registrationId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase
      .from("event_registrations")
      .update({ checked_in_at: checkedIn ? new Date().toISOString() : null })
      .eq("id", registrationId);
    return error;
  });
}

// --- Consultations ----------------------------------------------------------------------------------------

export async function cancelBooking(bookingId: string, reason: string): Promise<AdminResult> {
  if (!uuid.safeParse(bookingId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("cancel_consultation", {
      p_booking_id: bookingId,
      p_reason: reason.trim().slice(0, 500) || "Отказано от администратор",
    });
    return error;
  });
}

export async function setBookingOutcome(bookingId: string, status: "completed" | "no_show"): Promise<AdminResult> {
  if (!uuid.safeParse(bookingId).success || !["completed", "no_show"].includes(status)) return invalidInput;
  return run(async (supabase) => (await supabase.rpc("set_booking_outcome", { p_booking_id: bookingId, p_status: status })).error);
}

const servicesSchema = z.array(
  z.object({ typeId: z.uuid(), price: z.string().trim().regex(/^(\d{1,6}([.,]\d{1,2})?)?$/) }),
);

/** Replaces the list of consultation types a specialist offers (with optional own prices). */
export async function saveSpecialistServices(specialistId: string, services: { typeId: string; price: string }[]): Promise<AdminResult> {
  const parsed = servicesSchema.safeParse(services);
  if (!uuid.safeParse(specialistId).success || !parsed.success) return invalidInput;
  return run(async (supabase) => {
    const keep = parsed.data.map((s) => s.typeId);
    const remove = supabase.from("specialist_consultation_types").delete().eq("specialist_id", specialistId);
    const { error: deleteError } = keep.length ? await remove.not("consultation_type_id", "in", `(${keep.join(",")})`) : await remove;
    if (deleteError) return deleteError;
    if (!parsed.data.length) return null;
    const { error } = await supabase.from("specialist_consultation_types").upsert(
      parsed.data.map((s) => ({
        specialist_id: specialistId,
        consultation_type_id: s.typeId,
        price_cents_override: s.price === "" ? null : eurosToCents(s.price),
      })),
    );
    return error;
  });
}

export async function addAvailability(specialistId: string, input: AvailabilityInput): Promise<AdminResult> {
  const parsed = availabilitySchema.safeParse(input);
  if (!uuid.safeParse(specialistId).success || !parsed.success) return invalidInput;
  return run(async (supabase) => (await supabase.from("specialist_availability").insert(availabilityRows(specialistId, parsed.data))).error);
}

export async function deleteAvailability(id: string): Promise<AdminResult> {
  if (!uuid.safeParse(id).success) return invalidInput;
  return run(async (supabase) => (await supabase.from("specialist_availability").delete().eq("id", id)).error);
}

export async function addTimeOff(specialistId: string, input: TimeOffInput): Promise<AdminResult> {
  const parsed = timeOffSchema.safeParse(input);
  if (!uuid.safeParse(specialistId).success || !parsed.success) return invalidInput;
  return run(async (supabase) => (await supabase.from("specialist_time_off").insert(timeOffRow(specialistId, parsed.data))).error);
}

export async function deleteTimeOff(id: string): Promise<AdminResult> {
  if (!uuid.safeParse(id).success) return invalidInput;
  return run(async (supabase) => (await supabase.from("specialist_time_off").delete().eq("id", id)).error);
}

// --- Memberships and Viber --------------------------------------------------------------------------------

/** Replaces the Viber groups a plan opens. */
export async function savePlanGroups(planId: string, groupIds: string[]): Promise<AdminResult> {
  const parsed = z.array(z.uuid()).safeParse(groupIds);
  if (!uuid.safeParse(planId).success || !parsed.success) return invalidInput;
  return run(async (supabase) => {
    const remove = supabase.from("plan_viber_groups").delete().eq("plan_id", planId);
    const { error: deleteError } = parsed.data.length
      ? await remove.not("viber_group_id", "in", `(${parsed.data.join(",")})`)
      : await remove;
    if (deleteError) return deleteError;
    if (!parsed.data.length) return null;
    const { error } = await supabase
      .from("plan_viber_groups")
      .upsert(parsed.data.map((viber_group_id) => ({ plan_id: planId, viber_group_id })), { ignoreDuplicates: true });
    return error;
  });
}

type ViberStatus = Database["public"]["Enums"]["viber_access_status"];
const viberStatuses: ViberStatus[] = ["pending_invite", "invited", "joined", "removal_pending", "removed"];

/** Records what the admin did in Viber for one member and group. */
export async function setViberStatus(userId: string, groupId: string, status: ViberStatus): Promise<AdminResult> {
  if (!uuid.safeParse(userId).success || !uuid.safeParse(groupId).success || !viberStatuses.includes(status)) return invalidInput;
  return run(async (supabase) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("viber_memberships").upsert(
      {
        user_id: userId,
        viber_group_id: groupId,
        status,
        ...(status === "invited" ? { invited_at: now } : {}),
        ...(status === "joined" ? { joined_at: now } : {}),
        ...(status === "removed" ? { removed_at: now } : {}),
      },
      { onConflict: "user_id,viber_group_id" },
    );
    return error;
  });
}

/** Ends a bank-transfer subscription now. Card subscriptions are cancelled in Stripe, which then tells the site. */
export async function endBankTransferSubscription(subscriptionId: string): Promise<AdminResult> {
  if (!uuid.safeParse(subscriptionId).success) return invalidInput;
  return run(async (supabase) => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "canceled", canceled_at: now, ended_at: now })
      .eq("id", subscriptionId)
      .eq("provider", "bank_transfer")
      .in("status", ["pending_bank_transfer", "active"])
      .select("id");
    if (error) return error;
    return data?.length ? null : { message: "not_found" };
  });
}

// --- Payments ---------------------------------------------------------------------------------------------

export async function confirmBankTransfer(paymentId: string, note: string): Promise<AdminResult> {
  if (!uuid.safeParse(paymentId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("confirm_bank_transfer", {
      p_payment_id: paymentId,
      ...(note.trim() ? { p_note: note.trim().slice(0, 500) } : {}),
    });
    return error;
  });
}

export async function rejectBankTransfer(paymentId: string, reason: string): Promise<AdminResult> {
  if (!uuid.safeParse(paymentId).success) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("mark_payment_failed", {
      p_payment_id: paymentId,
      p_status: "cancelled",
      p_reason: reason.trim().slice(0, 500) || "Преводът не е получен",
    });
    return error;
  });
}

export async function recordRefund(paymentId: string, euros: string): Promise<AdminResult> {
  if (!uuid.safeParse(paymentId).success || !/^\d{1,6}([.,]\d{1,2})?$/.test(euros.trim())) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("record_refund", {
      p_payment_id: paymentId,
      p_refunded_amount_cents: eurosToCents(euros),
    });
    return error;
  });
}

/** Closes a payment flagged for review without a refund (e.g. the seat was given back by hand). */
export async function resolvePaymentReview(paymentId: string, note: string): Promise<AdminResult> {
  if (!uuid.safeParse(paymentId).success || !note.trim()) return invalidInput;
  return run(async (supabase) => {
    const { error } = await supabase.rpc("resolve_payment_review", { p_payment_id: paymentId, p_note: note.trim().slice(0, 500) });
    return error;
  });
}

// --- Users ------------------------------------------------------------------------------------------------

export async function setAccountStatus(userId: string, status: "active" | "suspended"): Promise<AdminResult> {
  if (!uuid.safeParse(userId).success || !["active", "suspended"].includes(status)) return invalidInput;
  return run(async (supabase, adminId) => {
    if (userId === adminId && status === "suspended") return { ok: false, error: "Не можеш да спреш собствения си профил." };
    return (await supabase.from("profiles").update({ status }).eq("id", userId)).error;
  });
}

export async function setRole(userId: string, role: "admin" | "specialist", granted: boolean): Promise<AdminResult> {
  if (!uuid.safeParse(userId).success || !["admin", "specialist"].includes(role)) return invalidInput;
  return run(async (supabase, adminId) => {
    if (granted) {
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role, granted_by: adminId }, { ignoreDuplicates: true });
      return error;
    }
    return (await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role)).error;
  });
}

// --- Maintenance ------------------------------------------------------------------------------------------

/** Runs the same clean-up as the scheduled job: expires unpaid holds, ends lapsed periods, closes past events. */
export async function runMaintenance(): Promise<AdminResult> {
  return run(async (supabase) => (await supabase.rpc("run_maintenance")).error);
}
