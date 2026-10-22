/** Bulgarian messages for database errors an admin can run into. */

const businessErrors: Record<string, string> = {
  forbidden: "Нямаш права за това действие.",
  not_authenticated: "Сесията ти е изтекла. Влез отново.",
  last_admin: "Това е последният администратор. Първо дай администраторски права на друг профил.",
  registration_not_found: "Записването не е намерено.",
  registration_not_active: "Записването вече е отказано или изтекло.",
  booking_not_found: "Консултацията не е намерена.",
  booking_not_active: "Консултацията вече е отказана или приключила.",
  booking_not_finished: "Консултацията още не е започнала.",
  payment_not_found: "Плащането не е намерено.",
  payment_not_confirmable: "Това плащане не може да бъде потвърдено.",
  payment_not_refundable: "Само платени суми могат да бъдат възстановени.",
  invalid_amount: "Невалидна сума.",
  invalid_status: "Невалиден статус.",
  profile_field_protected: "Това поле не може да се променя.",
  slot_unavailable: "Часът вече е зает.",
  login_email_not_found: "Няма профил с този имейл. Специалистът първо трябва да се регистрира на сайта.",
  not_found: "Записът не е намерен. Може да е изтрит.",
};

const postgresErrors: Record<string, string> = {
  "23505": "Вече има запис със същия адрес (slug) или същите данни.",
  "23503": "Записът се използва другаде (напр. има записвания или плащания) и не може да бъде изтрит. Скрий го вместо това.",
  "23514": "Някоя от стойностите е извън позволените граници.",
  "23P01": "Времето се застъпва с друга консултация.",
  "42501": "Нямаш права за това действие.",
  PGRST116: "Записът не е намерен. Може да е изтрит.",
  PGRST202: "Тази функция още не е добавена в базата данни.",
};

export const genericAdminError = "Нещо се обърка. Опитай отново.";

export function adminErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return genericAdminError;
  // Business errors from the database functions (P0001) and from the admin code use the same keys.
  if (error.message && businessErrors[error.message]) return businessErrors[error.message];
  return (error.code && postgresErrors[error.code]) || genericAdminError;
}
