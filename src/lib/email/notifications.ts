import "server-only";
import { after } from "next/server";
import { eventPath, routes } from "@/lib/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/locale";
import { absoluteUrl, sendEmail } from "./send";
import * as t from "./templates";

/**
 * The emails each flow sends. Every function takes an id, loads what it needs with the service key (the
 * recipient is often not the person who clicked), and sends through sendEmail(), which skips duplicates.
 *
 * Call them through notifyLater() from server actions and webhooks, so the page doesn't wait for Brevo and a
 * failed email never fails the action.
 */

type Admin = ReturnType<typeof createAdminClient>;

/** Runs the notification after the response is sent. Errors are logged, never thrown. */
export function notifyLater(task: () => Promise<unknown>) {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error("notification failed", error);
    }
  });
}

function adminClient(): Admin | null {
  try {
    return createAdminClient();
  } catch {
    console.warn("emails not sent: SUPABASE_SECRET_KEY is not set");
    return null;
  }
}

async function profileOf(db: Admin, userId: string) {
  const { data } = await db.from("profiles").select("id, email, first_name, last_name, phone").eq("id", userId).maybeSingle();
  return data;
}

async function bankInstructions(db: Admin, payment: { amount_cents: number; bank_reference: string | null; expires_at: string | null }) {
  const { data: bank } = await db
    .from("app_settings")
    .select("bank_transfer_beneficiary, bank_transfer_iban, bank_transfer_bic, bank_transfer_bank_name")
    .maybeSingle();
  return {
    amountCents: payment.amount_cents,
    reference: payment.bank_reference,
    deadline: payment.expires_at,
    beneficiary: bank?.bank_transfer_beneficiary ?? null,
    iban: bank?.bank_transfer_iban ?? null,
    bic: bank?.bank_transfer_bic ?? null,
    bankName: bank?.bank_transfer_bank_name ?? null,
  } satisfies t.BankInstructions;
}

async function pendingBankPayment(db: Admin, column: "event_registration_id" | "consultation_booking_id", id: string) {
  const { data } = await db
    .from("payments")
    .select("amount_cents, bank_reference, expires_at")
    .eq(column, id)
    .eq("provider", "bank_transfer")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// --- Events -----------------------------------------------------------------------------------------------

type EventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  format: "in_person" | "online" | "hybrid";
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
};

function eventPlace(event: EventRow): string {
  const venue = [event.venue_name, event.venue_address, event.city].filter(Boolean).join(", ");
  if (event.format === "online") return "Онлайн";
  if (event.format === "hybrid") return venue ? `${venue} и онлайн` : "На живо и онлайн";
  return venue;
}

async function loadEvent(db: Admin, eventId: string) {
  const [{ data: event }, { data: secret }] = await Promise.all([
    db
      .from("events")
      .select("id, slug, title, starts_at, ends_at, format, venue_name, venue_address, city")
      .eq("id", eventId)
      .maybeSingle(),
    db.from("event_private_details").select("online_url, attendee_instructions").eq("event_id", eventId).maybeSingle(),
  ]);
  return event ? { event: event as EventRow, secret } : null;
}

function eventData(event: EventRow, firstName: string | null): t.EventRegistrationData {
  return {
    firstName,
    eventTitle: event.title,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    place: eventPlace(event),
    eventUrl: absoluteUrl(eventPath(event.slug)),
    accountUrl: absoluteUrl(routes.accountEvents),
  };
}

/** After sign-up: "you're in" for free events, bank transfer instructions for paid ones. */
export async function notifyEventRegistration(registrationId: string) {
  const db = adminClient();
  if (!db) return;
  const { data: reg } = await db
    .from("event_registrations")
    .select("id, status, user_id, event_id")
    .eq("id", registrationId)
    .maybeSingle();
  if (!reg || (reg.status !== "confirmed" && reg.status !== "pending_payment")) return;

  const [loaded, person] = await Promise.all([loadEvent(db, reg.event_id), profileOf(db, reg.user_id)]);
  if (!loaded || !person) return;
  const data = eventData(loaded.event, person.first_name);
  const common = {
    to: { email: person.email, name: `${person.first_name} ${person.last_name}`.trim() },
    userId: person.id,
    related: { table: "event_registrations", id: reg.id },
  };

  if (reg.status === "confirmed") {
    await sendEmail({
      ...common,
      template: "event_registration_confirmed",
      dedupeKey: `event_registration_confirmed:${reg.id}`,
      content: t.eventRegistrationConfirmed({
        ...data,
        onlineUrl: loaded.secret?.online_url,
        attendeeInstructions: loaded.secret?.attendee_instructions,
      }),
    });
    return;
  }

  const payment = await pendingBankPayment(db, "event_registration_id", reg.id);
  if (!payment) return;
  await sendEmail({
    ...common,
    template: "event_registration_bank_transfer",
    dedupeKey: `event_registration_bank_transfer:${reg.id}`,
    content: t.eventRegistrationPendingPayment({ ...data, bank: await bankInstructions(db, payment) }),
  });
}

// --- Payments ---------------------------------------------------------------------------------------------

/**
 * "Payment confirmed" for any succeeded payment: bank transfers confirmed by an admin and Stripe payments
 * (call it from the Stripe webhook once the payment row is marked succeeded).
 */
export async function notifyPaymentConfirmed(paymentId: string) {
  const db = adminClient();
  if (!db) return;
  const { data: payment } = await db
    .from("payments")
    .select("id, user_id, status, provider, amount_cents, paid_at, event_registration_id, consultation_booking_id, subscription_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment || payment.status !== "succeeded" || !payment.user_id) return;

  const person = await profileOf(db, payment.user_id);
  if (!person) return;

  let details: Pick<t.PaymentConfirmedData, "purpose" | "rows" | "url" | "urlLabel" | "onlineUrl" | "attendeeInstructions"> | null =
    null;

  if (payment.event_registration_id) {
    const { data: reg } = await db.from("event_registrations").select("event_id").eq("id", payment.event_registration_id).maybeSingle();
    const loaded = reg ? await loadEvent(db, reg.event_id) : null;
    if (loaded) {
      const data = eventData(loaded.event, person.first_name);
      details = {
        purpose: `Събитие „${loaded.event.title}“`,
        rows: [
          { label: "Кога", value: t.formatWhen(data.startsAt, data.endsAt) },
          { label: "Къде", value: data.place },
        ],
        url: data.eventUrl,
        urlLabel: "Виж събитието",
        onlineUrl: loaded.secret?.online_url,
        attendeeInstructions: loaded.secret?.attendee_instructions,
      };
    }
  } else if (payment.consultation_booking_id) {
    const booking = await loadBooking(db, payment.consultation_booking_id);
    if (booking) {
      details = {
        purpose: `Консултация „${booking.service.name}“`,
        rows: [
          { label: "Специалист", value: booking.specialist.full_name },
          { label: "Кога", value: t.formatWhen(booking.starts_at, booking.ends_at) },
          { label: "Къде", value: booking.service.location_info },
        ],
        url: absoluteUrl(routes.accountConsultations),
        urlLabel: "Моите консултации",
      };
    }
  } else if (payment.subscription_id) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("current_period_end, plan_id")
      .eq("id", payment.subscription_id)
      .maybeSingle();
    const { data: plan } = sub ? await db.from("membership_plans").select("name").eq("id", sub.plan_id).maybeSingle() : { data: null };
    if (plan) {
      details = {
        purpose: `Членство „${plan.name}“`,
        rows: [{ label: "Активно до", value: sub?.current_period_end ? formatDate(sub.current_period_end) : null }],
        url: absoluteUrl(routes.accountSubscriptions),
        urlLabel: "Моите абонаменти",
      };
    }
  }
  if (!details) return;

  await sendEmail({
    template: "payment_confirmed",
    to: { email: person.email, name: `${person.first_name} ${person.last_name}`.trim() },
    userId: person.id,
    dedupeKey: `payment_confirmed:${payment.id}`,
    related: { table: "payments", id: payment.id },
    content: t.paymentConfirmed({
      firstName: person.first_name,
      amountCents: payment.amount_cents,
      paidAt: payment.paid_at,
      method: payment.provider,
      ...details,
    }),
  });
}

// --- Consultations ----------------------------------------------------------------------------------------

async function loadBooking(db: Admin, bookingId: string) {
  const { data: booking } = await db
    .from("consultation_bookings")
    .select(
      "id, status, user_id, specialist_id, consultation_type_id, starts_at, ends_at, price_cents, user_note, reschedule_count, cancelled_by, cancellation_reason",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;
  const [{ data: service }, { data: specialist }, { data: contact }, client] = await Promise.all([
    db.from("consultation_types").select("name, location_info").eq("id", booking.consultation_type_id).maybeSingle(),
    db.from("specialists").select("full_name, user_id").eq("id", booking.specialist_id).maybeSingle(),
    db.from("specialist_private").select("notification_email").eq("specialist_id", booking.specialist_id).maybeSingle(),
    profileOf(db, booking.user_id),
  ]);
  if (!service || !specialist || !client) return null;
  const specialistAccount = specialist.user_id ? await profileOf(db, specialist.user_id) : null;
  const specialistEmail = contact?.notification_email?.trim() || specialistAccount?.email || null;
  return { ...booking, service, specialist, client, specialistAccount, specialistEmail };
}

type Booking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

function clientData(b: Booking): t.ConsultationData {
  return {
    firstName: b.client.first_name,
    serviceName: b.service.name,
    specialistName: b.specialist.full_name,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    locationInfo: b.service.location_info,
    priceCents: b.price_cents,
    accountUrl: absoluteUrl(routes.accountConsultations),
  };
}

function specialistData(b: Booking): t.SpecialistNoticeData {
  return {
    specialistFirstName: b.specialistAccount?.first_name ?? b.specialist.full_name.split(" ")[0] ?? null,
    clientName: `${b.client.first_name} ${b.client.last_name}`.trim(),
    clientEmail: b.client.email,
    clientPhone: b.client.phone,
    serviceName: b.service.name,
    startsAt: b.starts_at,
    endsAt: b.ends_at,
    note: b.user_note,
    awaitingPayment: b.status === "pending_payment",
    scheduleUrl: absoluteUrl(routes.accountSpecialist),
  };
}

const toClient = (b: Booking) => ({
  to: { email: b.client.email, name: `${b.client.first_name} ${b.client.last_name}`.trim() },
  userId: b.client.id,
  related: { table: "consultation_bookings", id: b.id },
});

const toSpecialist = (b: Booking) => ({
  to: { email: b.specialistEmail!, name: b.specialist.full_name },
  userId: b.specialist.user_id,
  related: { table: "consultation_bookings", id: b.id },
});

/** New booking: confirmation (or bank transfer instructions) to the client, and a notice to the specialist. */
export async function notifyConsultationBooked(bookingId: string) {
  const db = adminClient();
  if (!db) return;
  const b = await loadBooking(db, bookingId);
  if (!b || (b.status !== "confirmed" && b.status !== "pending_payment")) return;

  const sends: Promise<unknown>[] = [];
  if (b.status === "confirmed") {
    const { data: settings } = await db.from("app_settings").select("consultation_cancel_deadline_hours").maybeSingle();
    sends.push(
      sendEmail({
        ...toClient(b),
        template: "consultation_booked",
        dedupeKey: `consultation_booked:${b.id}:client`,
        content: t.consultationBooked({ ...clientData(b), cancelDeadlineHours: settings?.consultation_cancel_deadline_hours ?? null }),
      }),
    );
  } else {
    const payment = await pendingBankPayment(db, "consultation_booking_id", b.id);
    if (payment) {
      sends.push(
        sendEmail({
          ...toClient(b),
          template: "consultation_bank_transfer",
          dedupeKey: `consultation_bank_transfer:${b.id}:client`,
          content: t.consultationPendingPayment({ ...clientData(b), bank: await bankInstructions(db, payment) }),
        }),
      );
    }
  }
  if (b.specialistEmail) {
    sends.push(
      sendEmail({
        ...toSpecialist(b),
        template: "consultation_booked_specialist",
        dedupeKey: `consultation_booked:${b.id}:specialist`,
        content: t.specialistBookingCreated(specialistData(b)),
      }),
    );
  }
  await Promise.all(sends);
}

/** Cancelled by the client, the specialist or an admin. Whoever cancelled doesn't get told about it again. */
export async function notifyConsultationCancelled(bookingId: string) {
  const db = adminClient();
  if (!db) return;
  const b = await loadBooking(db, bookingId);
  if (!b || b.status !== "cancelled") return;

  const byClient = b.cancelled_by === b.user_id;
  const bySpecialist = Boolean(b.specialist.user_id && b.cancelled_by === b.specialist.user_id);
  const sends: Promise<unknown>[] = [
    sendEmail({
      ...toClient(b),
      template: "consultation_cancelled",
      dedupeKey: `consultation_cancelled:${b.id}:client`,
      content: t.consultationCancelled({
        ...clientData(b),
        reason: b.cancellation_reason,
        byClient,
        bookUrl: absoluteUrl(routes.consultations),
      }),
    }),
  ];
  if (b.specialistEmail && !bySpecialist) {
    sends.push(
      sendEmail({
        ...toSpecialist(b),
        template: "consultation_cancelled_specialist",
        dedupeKey: `consultation_cancelled:${b.id}:specialist`,
        content: t.specialistBookingCancelled({ ...specialistData(b), reason: byClient ? "Отказано от клиента" : b.cancellation_reason }),
      }),
    );
  }
  await Promise.all(sends);
}

/** Moved to a new time by the client. `previousStartsAt` is read before the move. */
export async function notifyConsultationRescheduled(bookingId: string, previousStartsAt: string) {
  const db = adminClient();
  if (!db) return;
  const b = await loadBooking(db, bookingId);
  if (!b || b.starts_at === previousStartsAt) return;

  const key = `consultation_rescheduled:${b.id}:${b.reschedule_count}`;
  const sends: Promise<unknown>[] = [
    sendEmail({
      ...toClient(b),
      template: "consultation_rescheduled",
      dedupeKey: `${key}:client`,
      content: t.consultationRescheduled({ ...clientData(b), previousStartsAt }),
    }),
  ];
  if (b.specialistEmail) {
    sends.push(
      sendEmail({
        ...toSpecialist(b),
        template: "consultation_rescheduled_specialist",
        dedupeKey: `${key}:specialist`,
        content: t.specialistBookingRescheduled({ ...specialistData(b), previousStartsAt }),
      }),
    );
  }
  await Promise.all(sends);
}

