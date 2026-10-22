/**
 * Bulgarian messages for the business error keys the database functions raise as P0001
 * (list in docs/database.md). Shared by the public pages and the admin panel.
 */
const dbMessages: Record<string, string> = {
  not_authenticated: "Сесията ти е изтекла. Влез отново в профила си.",
  account_suspended: "Профилът ти е временно спрян. Свържи се с нас за повече информация.",
  forbidden: "Нямаш права за това действие.",
  event_not_found: "Събитието не е намерено или вече не е активно.",
  registration_closed: "Записването за това събитие е приключило.",
  registration_not_open_yet: "Записването за това събитие още не е започнало.",
  already_registered: "Вече си записана за това събитие.",
  event_full: "Всички места за това събитие са заети.",
  payment_method_not_allowed: "Този начин на плащане не е достъпен за избраното.",
  registration_not_found: "Записването не е намерено.",
  registration_not_active: "Записването вече е отказано или изтекло.",
  cancellation_deadline_passed: "Срокът за отказ е изтекъл. Свържи се с нас, ако имаш нужда от помощ.",
  slot_unavailable: "Този час вече не е свободен. Избери друг.",
  too_late_for_bank_transfer: "Остава твърде малко време за банков превод. Избери друг начин на плащане.",
  booking_not_found: "Консултацията не е намерена.",
  booking_not_active: "Консултацията вече е отказана или изтекла.",
  booking_not_finished: "Консултацията още не е приключила.",
  reschedule_limit_reached: "Достигнат е броят на позволените премествания.",
  plan_not_found: "Планът не е намерен или вече не е активен.",
  already_subscribed: "Вече имаш активен абонамент за този план.",
  renewal_not_due_yet: "Подновяването още не е започнало.",
  not_eligible: "Нямаш достъп до това. Провери абонамента си.",
  payment_not_found: "Плащането не е намерено.",
  payment_not_confirmable: "Това плащане не може да бъде потвърдено.",
  payment_not_refundable: "Това плащане не може да бъде възстановено.",
  amount_mismatch: "Сумата не съвпада с дължимата.",
  invalid_amount: "Невалидна сума.",
  invalid_status: "Невалиден статус.",
  profile_field_protected: "Това поле не може да бъде променено от профила.",
  last_admin: "Не можеш да премахнеш последния администратор.",
};

export const genericDbError = "Нещо се обърка. Опитай отново след малко.";

/** The Bulgarian message for a Supabase/PostgREST error, falling back to a generic one. */
export function dbErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return genericDbError;
  return (error.code === "P0001" && error.message && dbMessages[error.message]) || genericDbError;
}

/** The raw key (e.g. "event_full") when the error is a known business error. */
export function dbErrorKey(error: { code?: string; message?: string } | null | undefined): string | undefined {
  return error?.code === "P0001" && error.message && error.message in dbMessages ? error.message : undefined;
}
