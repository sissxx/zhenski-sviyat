import type { Tone } from "@/components/admin/StatusChip";
import type { Database } from "@/lib/supabase/database.types";

/** Bulgarian labels and chip colours for the database's status values. */

type Enums = Database["public"]["Enums"];
type Labelled<K extends string> = Record<K, { label: string; tone: Tone }>;

export const eventStatus: Labelled<Enums["event_status"]> = {
  draft: { label: "Чернова", tone: "neutral" },
  published: { label: "Публикувано", tone: "success" },
  cancelled: { label: "Отменено", tone: "error" },
  completed: { label: "Приключило", tone: "info" },
};

export const registrationStatus: Labelled<Enums["registration_status"]> = {
  pending_payment: { label: "Чака плащане", tone: "warning" },
  confirmed: { label: "Потвърдено", tone: "success" },
  cancelled: { label: "Отказано", tone: "neutral" },
  expired: { label: "Изтекло", tone: "neutral" },
};

export const bookingStatus: Labelled<Enums["booking_status"]> = {
  pending_payment: { label: "Чака плащане", tone: "warning" },
  confirmed: { label: "Потвърдена", tone: "success" },
  cancelled: { label: "Отказана", tone: "neutral" },
  completed: { label: "Проведена", tone: "info" },
  no_show: { label: "Неявяване", tone: "error" },
  expired: { label: "Изтекла", tone: "neutral" },
};

export const paymentStatus: Labelled<Enums["payment_status"]> = {
  pending: { label: "Чака", tone: "warning" },
  succeeded: { label: "Платено", tone: "success" },
  failed: { label: "Неуспешно", tone: "error" },
  cancelled: { label: "Отказано", tone: "neutral" },
  expired: { label: "Изтекло", tone: "neutral" },
  refunded: { label: "Възстановено", tone: "info" },
  partially_refunded: { label: "Частично възстановено", tone: "info" },
};

export const subscriptionStatus: Labelled<Enums["subscription_status"]> = {
  pending_bank_transfer: { label: "Чака превод", tone: "warning" },
  incomplete: { label: "Незавършен", tone: "warning" },
  trialing: { label: "Пробен", tone: "info" },
  active: { label: "Активен", tone: "success" },
  past_due: { label: "Просрочено плащане", tone: "warning" },
  canceled: { label: "Прекратен", tone: "neutral" },
  unpaid: { label: "Неплатен", tone: "error" },
  expired: { label: "Изтекъл", tone: "neutral" },
};

export const viberStatus: Labelled<Enums["viber_access_status"]> = {
  pending_invite: { label: "Чака покана", tone: "warning" },
  invited: { label: "Поканена", tone: "info" },
  joined: { label: "В групата", tone: "success" },
  removal_pending: { label: "За премахване", tone: "warning" },
  removed: { label: "Премахната", tone: "neutral" },
};

export const accountStatus: Labelled<Enums["account_status"]> = {
  active: { label: "Активен", tone: "success" },
  suspended: { label: "Спрян", tone: "error" },
};

export const providerLabel: Record<Enums["payment_provider"], string> = {
  stripe: "Карта (Stripe)",
  bank_transfer: "Банков превод",
};

export const roleLabel: Record<Enums["app_role"], string> = { admin: "Администратор", specialist: "Специалист" };

export const weekdayLabel: Record<number, string> = {
  1: "Понеделник",
  2: "Вторник",
  3: "Сряда",
  4: "Четвъртък",
  5: "Петък",
  6: "Събота",
  7: "Неделя",
};

/** "Мария Иванова" or the email when the name is empty. */
export const personName = (p: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) =>
  p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "—" : "Изтрит профил";
