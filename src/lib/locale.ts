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

const weekdayDayMonthFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Day picker label, e.g. "пт, 23.10". Format on the server so the client does not re-render it differently. */
export function formatWeekdayDayMonth(value: DateInput): string {
  return weekdayDayMonthFormat.format(toDate(value));
}

const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar day in Sofia as "YYYY-MM-DD". */
export function sofiaDateKey(value: DateInput): string {
  return dateKeyFormat.format(toDate(value));
}

const offsetFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Sofia's offset from UTC in minutes at the given instant (120 in winter, 180 in summer). */
function sofiaOffsetMinutes(instant: Date): number {
  const parts = Object.fromEntries(offsetFormat.formatToParts(instant).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Converts a Sofia wall-clock date and time ("2027-05-15", "18:30") to a UTC Date. */
export function sofiaWallTimeToUtc(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = sofiaOffsetMinutes(guess);
  const result = new Date(guess.getTime() - offset * 60000);
  // Re-check once in case the guess fell on the other side of a DST change.
  const corrected = sofiaOffsetMinutes(result);
  return corrected === offset ? result : new Date(guess.getTime() - corrected * 60000);
}
