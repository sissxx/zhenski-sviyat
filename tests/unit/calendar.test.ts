import { describe, expect, it } from "vitest";
import { buildIcs, icsText } from "@/lib/calendar/ics";

describe("calendar files", () => {
  const now = new Date("2026-11-16T10:00:00Z");

  it("writes one event in UTC with a reminder two hours before", () => {
    const ics = buildIcs(
      { uid: "event-1@zhenski-sviyat", title: "Женска сила", startsAt: "2026-11-27T18:25:00+00:00", endsAt: "2026-11-27T20:00:00+00:00", location: "София" },
      now,
    );
    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("DTSTART:20261127T182500Z");
    expect(ics).toContain("DTEND:20261127T200000Z");
    expect(ics).toContain("DTSTAMP:20261116T100000Z");
    expect(ics).toContain("SUMMARY:Женска сила");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("lasts an hour when there is no end time", () => {
    expect(buildIcs({ uid: "x", title: "Среща", startsAt: "2026-11-27T18:00:00Z" }, now)).toContain("DTEND:20261127T190000Z");
  });

  it("escapes commas, semicolons and line breaks, and folds long lines", () => {
    expect(icsText("София, ул. 1; ет. 2\nвход А")).toBe("София\\, ул. 1\; ет. 2\\nвход А");
    const ics = buildIcs({ uid: "x", title: "Дълго заглавие ".repeat(10), startsAt: "2026-11-27T18:00:00Z" }, now);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
