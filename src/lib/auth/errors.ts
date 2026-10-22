/** Bulgarian messages for Supabase Auth error codes (https://supabase.com/docs/guides/auth/debugging/error-codes). */
const authMessages: Record<string, string> = {
  invalid_credentials: "Грешен имейл или парола.",
  email_not_confirmed: "Имейлът ти още не е потвърден. Провери пощата си за линка за потвърждение.",
  user_already_exists: "Вече има профил с този имейл. Влез в профила си или възстанови паролата си.",
  email_exists: "Вече има профил с този имейл. Влез в профила си или възстанови паролата си.",
  weak_password: "Паролата е твърде слаба. Избери по-дълга парола с букви и цифри.",
  same_password: "Новата парола трябва да е различна от старата.",
  email_address_invalid: "Този имейл адрес не може да бъде използван.",
  signup_disabled: "Регистрацията временно е спряна. Опитай отново по-късно.",
  user_banned: "Профилът е спрян. Свържи се с нас за повече информация.",
  over_email_send_rate_limit: "Изпратихме твърде много имейли за кратко време. Опитай отново след няколко минути.",
  over_request_rate_limit: "Твърде много опити. Изчакай малко и опитай отново.",
  session_not_found: "Сесията ти е изтекла. Влез отново.",
  reauthentication_needed: "От съображения за сигурност влез отново и опитай пак.",
  otp_expired: "Линкът е изтекъл или вече е използван. Поискай нов.",
  profile_field_protected: "Това поле не може да бъде променено от профила.",
};

export const genericAuthError = "Нещо се обърка. Опитай отново след малко.";
export const notConfiguredError = "Профилите все още не са свързани със сървъра. Опитай отново по-късно.";

export function authErrorMessage(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return genericAuthError;
  return (error.code && authMessages[error.code]) || (error.message && authMessages[error.message]) || genericAuthError;
}
