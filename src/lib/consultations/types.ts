import type { Database } from "@/lib/supabase/database.types";
import { formatPrice } from "@/lib/locale";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

/** A specialist offering one service, with the price she charges for it. */
export type ServiceSpecialist = { id: string; slug: string; name: string; title: string | null; priceCents: number };

/** An active consultation type with the active specialists who offer it, as the booking page shows it. */
export type ConsultationService = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  locationInfo: string | null;
  requiresPrepayment: boolean;
  allowBankTransfer: boolean;
  specialists: ServiceSpecialist[];
};

/** A free start time. Labels are formatted on the server (Sofia time) so the client shows the same text. */
export type ConsultationSlot = {
  startsAt: string;
  specialistId: string;
  dateKey: string;
  dayLabel: string;
  timeLabel: string;
};

/** Admin-configurable booking rules from app_settings. */
export type BookingRules = {
  minNoticeHours: number;
  maxAdvanceDays: number;
  cancelDeadlineHours: number;
  maxReschedules: number;
};

/**
 * How a booking at this price gets paid:
 * free, paid on site (no prepayment), card or bank transfer before the session, or card only.
 */
export type PaymentMode = "free" | "on_site" | "bank" | "card_only";

export function paymentModeOf(service: Pick<ConsultationService, "requiresPrepayment" | "allowBankTransfer">, priceCents: number): PaymentMode {
  if (priceCents === 0) return "free";
  if (!service.requiresPrepayment) return "on_site";
  return service.allowBankTransfer ? "bank" : "card_only";
}

/** "40 €", "от 30 €" when specialists charge different prices, "Безплатно". */
export function servicePriceLabel(service: ConsultationService): string {
  const prices = service.specialists.map((s) => s.priceCents);
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  if (min === 0 && Math.max(...prices) === 0) return "Безплатно";
  return Math.max(...prices) === min ? formatPrice(min) : `от ${formatPrice(min)}`;
}

export const bookingPriceLabel = (priceCents: number, mode: PaymentMode) =>
  mode === "free" ? "Безплатно" : mode === "on_site" ? `${formatPrice(priceCents)} · плащане на място` : formatPrice(priceCents);

export const specialistLabel = (s: { name: string; title: string | null }) => (s.title ? `${s.name}, ${s.title}` : s.name);

export const bookingStatusLabels: Record<BookingStatus, string> = {
  confirmed: "Потвърдена",
  pending_payment: "Чака плащане",
  cancelled: "Отказана",
  expired: "Изтекла",
  completed: "Проведена",
  no_show: "Неявяване",
};

export const bookingStatusColors = {
  confirmed: "success",
  pending_payment: "warning",
  cancelled: "default",
  expired: "default",
  completed: "info",
  no_show: "default",
} as const satisfies Record<BookingStatus, string>;
