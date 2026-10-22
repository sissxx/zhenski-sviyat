import { TIME_ZONE, sofiaWallTimeToUtc } from "@/lib/locale";

/**
 * Conversions between admin form values (strings and booleans, as the inputs hold them) and database values.
 * Money in forms is euros ("20" or "20,50"); in the database it is cents. Date-times in forms are Sofia wall
 * time ("2027-05-15T18:30", from <input type="datetime-local">); in the database they are UTC.
 */

export type FormValues = Record<string, string | boolean | string[]>;

export const emptyToNull = (value: string | undefined | null) => {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

export function eurosToCents(value: string): number {
  return Math.round(Number(value.trim().replace(/\s/g, "").replace(",", ".")) * 100);
}

export const optionalEurosToCents = (value: string) => (emptyToNull(value) === null ? null : eurosToCents(value));

export function centsToEuros(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const euros = cents / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace(".", ",");
}

export const optionalInt = (value: string) => (emptyToNull(value) === null ? null : Number.parseInt(value, 10));

export const intToString = (value: number | null | undefined) => (value === null || value === undefined ? "" : String(value));

/** "2027-05-15T18:30" in Sofia → ISO UTC string. */
export function localDateTimeToIso(value: string): string {
  const [date, time] = value.split("T");
  return sofiaWallTimeToUtc(date, time.slice(0, 5)).toISOString();
}

export const optionalLocalDateTimeToIso = (value: string) => (emptyToNull(value) === null ? null : localDateTimeToIso(value));

const wallClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO UTC string → "2027-05-15T18:30" in Sofia, for a datetime-local input. */
export function isoToLocalDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const parts = Object.fromEntries(wallClock.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "09:00:00" → "09:00" for a time input. */
export const timeToInput = (value: string | null | undefined) => (value ? value.slice(0, 5) : "");

/** One list item per line (plan features). */
export const linesToList = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const listToLines = (value: unknown) => (Array.isArray(value) ? value.map(String).join("\n") : "");

/** Latin slug from a Bulgarian title, for the slug field's suggestion. */
export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
    н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
