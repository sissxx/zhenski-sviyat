"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { dbErrorMessage } from "@/lib/db-errors";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { consultationConfirmationPath, loginPath, routes } from "@/lib/routes";
import { listConsultationServices, listFreeSlots } from "./queries";
import { paymentModeOf, type ConsultationSlot } from "./types";

/**
 * Consultation slots, booking, cancelling and moving. The database functions check everything again
 * (working hours, time off, overlaps, notice, deadlines, price), so these actions only validate the
 * input and translate errors to Bulgarian.
 */

export type ConsultationActionResult = { ok: true } | { ok: false; error: string };

const notConnected = { ok: false, error: "Записването все още не е свързано със сървъра. Опитай отново по-късно." } as const;
const notFound = { ok: false, error: dbErrorMessage({ code: "P0001", message: "booking_not_found" }) } as const;

const slotsSchema = z.object({ serviceId: z.uuid(), specialistId: z.uuid().nullable() });

/** Free times for a service, with one specialist or anyone who offers it. Readable without logging in. */
export async function loadSlots(input: z.infer<typeof slotsSchema>): Promise<ConsultationSlot[]> {
  const parsed = slotsSchema.safeParse(input);
  if (!parsed.success) return [];
  const { serviceId, specialistId } = parsed.data;
  const service = (await listConsultationServices()).find((s) => s.id === serviceId);
  if (!service) return [];
  const ids = service.specialists.map((s) => s.id).filter((id) => !specialistId || id === specialistId);
  return listFreeSlots(serviceId, ids);
}

const bookSchema = z.object({
  serviceId: z.uuid(),
  specialistId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(1000),
  // Card payments come with Stripe in a later step; until then prepaid services take bank transfers only.
  paymentMethod: z.enum(["bank"]).optional(),
});

export async function bookConsultation(input: z.infer<typeof bookSchema>): Promise<ConsultationActionResult> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Моля, провери въведените данни." };
  if (!isSupabaseConfigured()) return notConnected;

  const { serviceId, specialistId, startsAt, note, paymentMethod } = parsed.data;
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(routes.consultations));

  const service = (await listConsultationServices()).find((s) => s.id === serviceId);
  const specialist = service?.specialists.find((s) => s.id === specialistId);
  if (!service || !specialist) return { ok: false, error: "Тази услуга вече не е достъпна. Презареди страницата." };

  const mode = paymentModeOf(service, specialist.priceCents);
  if (mode === "card_only") return { ok: false, error: "Плащането с карта ще бъде достъпно скоро. Свържи се с нас, за да запазиш час." };
  if (mode === "bank" && paymentMethod !== "bank") return { ok: false, error: "Избери банков превод." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_consultation", {
    p_specialist_id: specialistId,
    p_consultation_type_id: serviceId,
    p_starts_at: startsAt,
    ...(mode === "bank" ? { p_payment_method: "bank_transfer" as const } : {}),
    ...(note ? { p_note: note } : {}),
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  const booking = data?.[0];
  if (!booking) return { ok: false, error: dbErrorMessage(null) };

  revalidatePath(routes.accountConsultations);
  redirect(consultationConfirmationPath(booking.booking_id));
}

export async function cancelConsultation(bookingId: string): Promise<ConsultationActionResult> {
  if (!z.uuid().safeParse(bookingId).success) return notFound;
  if (!isSupabaseConfigured()) return notConnected;

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_consultation", { p_booking_id: bookingId });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(routes.accountConsultations);
  return { ok: true };
}

export async function rescheduleConsultation(bookingId: string, startsAt: string): Promise<ConsultationActionResult> {
  if (!z.uuid().safeParse(bookingId).success) return notFound;
  if (!z.iso.datetime({ offset: true }).safeParse(startsAt).success) return { ok: false, error: "Избери свободен час." };
  if (!isSupabaseConfigured()) return notConnected;

  const supabase = await createClient();
  const { error } = await supabase.rpc("reschedule_consultation", { p_booking_id: bookingId, p_new_starts_at: startsAt });
  if (error) return { ok: false, error: dbErrorMessage(error) };

  revalidatePath(routes.accountConsultations);
  redirect(`${routes.accountConsultations}?premestena=1`);
}
