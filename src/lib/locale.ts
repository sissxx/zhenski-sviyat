/**
 * Regional settings for the whole site. Store timestamps in UTC (ISO 8601),
 * and format them for people only through these helpers.
 */
export const LOCALE = "bg-BG";
export const TIME_ZONE = "Europe/Sofia";
export const CURRENCY = "EUR";

const priceWithCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const priceWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats an amount in euro cents, e.g. 800 → "8 €", 2150 → "21,50 €". */
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return Number.isInteger(euros) ? priceWhole.format(euros) : priceWithCents.format(euros);
}

type DateInput = Date | string | number;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dayMonthFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
});

/** "15 май 2027 г." */
export function formatDate(value: DateInput): string {
  return dateFormat.format(toDate(value));
}

/** "15 май 2027 г. в 18:30" */
export function formatDateTime(value: DateInput): string {
  return dateTimeFormat.format(toDate(value));
}

/** "18:30" */
export function formatTime(value: DateInput): string {
  return timeFormat.format(toDate(value));
}

/** Short badge for event cards: "15 МАЙ", "05 ЮНИ". */
export function formatDayMonthBadge(value: DateInput): string {
  const parts = dayMonthFormat.formatToParts(toDate(value));
  const day = (parts.find((p) => p.type === "day")?.value ?? "").padStart(2, "0");
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(".", "");
  return `${day} ${month}`.toLocaleUpperCase(LOCALE);
}
