import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDayMonthBadge,
  formatPrice,
  formatTime,
  sofiaDateKey,
  sofiaWallTimeToUtc,
} from "@/lib/locale";
import { plain } from "./helpers";

describe("formatPrice", () => {
  it("drops cents for whole euros", () => {
    expect(plain(formatPrice(800))).toBe("8 €");
    expect(plain(formatPrice(0))).toBe("0 €");
  });

  it("shows two decimals with a comma otherwise", () => {
    expect(plain(formatPrice(2150))).toBe("21,50 €");
    expect(plain(formatPrice(5))).toBe("0,05 €");
  });

  it("groups thousands from five digits, as Bulgarian does", () => {
    expect(plain(formatPrice(125000))).toBe("1250 €");
    expect(plain(formatPrice(1250000))).toBe("12 500 €");
  });
});

describe("dates in Sofia time", () => {
  // 15:30 UTC is 18:30 in Sofia during summer time (UTC+3).
  const summer = "2027-05-15T15:30:00Z";

  it("formats date, date-time and time", () => {
    expect(plain(formatDate(summer))).toBe("15 май 2027 г.");
    expect(plain(formatDateTime(summer))).toBe("15 май 2027 г. в 18:30");
    expect(formatTime(summer)).toBe("18:30");
  });

  it("uses the winter offset (UTC+2) in January", () => {
    expect(formatTime("2027-01-10T08:00:00Z")).toBe("10:00");
  });

  it("builds the event card badge", () => {
    expect(formatDayMonthBadge(summer)).toBe("15 МАЙ");
    expect(formatDayMonthBadge("2027-06-05T12:00:00Z")).toBe("05 ЮНИ");
  });

  it("puts late-evening UTC times on the next Sofia day", () => {
    expect(sofiaDateKey("2027-05-15T22:30:00Z")).toBe("2027-05-16");
  });
});

describe("sofiaWallTimeToUtc", () => {
  it("converts summer and winter wall times", () => {
    expect(sofiaWallTimeToUtc("2027-05-15", "18:30").toISOString()).toBe("2027-05-15T15:30:00.000Z");
    expect(sofiaWallTimeToUtc("2027-01-10", "10:00").toISOString()).toBe("2027-01-10T08:00:00.000Z");
  });

  it("handles the days the clocks change", () => {
    // Summer time starts 28 March 2027 at 03:00 local; ends 31 October 2027 at 04:00 local.
    expect(sofiaWallTimeToUtc("2027-03-28", "12:00").toISOString()).toBe("2027-03-28T09:00:00.000Z");
    expect(sofiaWallTimeToUtc("2027-10-31", "12:00").toISOString()).toBe("2027-10-31T10:00:00.000Z");
  });

  it("round-trips with the Sofia formatters", () => {
    const utc = sofiaWallTimeToUtc("2027-11-02", "09:15");
    expect(sofiaDateKey(utc)).toBe("2027-11-02");
    expect(formatTime(utc)).toBe("09:15");
  });
});
