/**
 * A one-event calendar file (.ics) that Google, Apple and Outlook calendars import. Used for the
 * "Добави в календара" links on event and consultation confirmations.
 */

export type CalendarEntry = {
  /** Stable id, so importing the file twice updates the same calendar entry. */
  uid: string;
  title: string;
  startsAt: string;
  /** Without an end the entry lasts an hour. */
  endsAt?: string | null;
  location?: string | null;
  description?: string | null;
  url?: string | null;
};

/** 2026-11-27T18:25:00Z -> 20261127T182500Z (UTC, so every calendar shows the right local time). */
function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escapes text values as RFC 5545 asks: backslash, semicolon, comma and line breaks. */
export function icsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines longer than 75 bytes are folded onto continuation lines that start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const charSize = new TextEncoder().encode(char).length;
    if (size + charSize > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += charSize;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(entry: CalendarEntry, now: Date = new Date()): string {
  const end = entry.endsAt ?? new Date(new Date(entry.startsAt).getTime() + 3600 * 1000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zhenski svyat//BG",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${entry.uid}`,
    `DTSTAMP:${icsDate(now.toISOString())}`,
    `DTSTART:${icsDate(entry.startsAt)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(entry.title)}`,
    entry.location ? `LOCATION:${icsText(entry.location)}` : null,
    entry.description ? `DESCRIPTION:${icsText(entry.description)}` : null,
    entry.url ? `URL:${entry.url}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(entry.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The HTTP response that downloads the file. */
export function icsResponse(ics: string, fileName: string): Response {
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
