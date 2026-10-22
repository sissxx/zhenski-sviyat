import { describe, expect, it } from "vitest";
import {
  centsToEuros,
  emptyToNull,
  eurosToCents,
  isoToLocalDateTime,
  linesToList,
  listToLines,
  localDateTimeToIso,
  optionalEurosToCents,
  optionalInt,
  slugify,
} from "@/lib/admin/convert";
import { availabilityRows, availabilitySchema, timeOffRow, timeOffSchema } from "@/lib/admin/schedule";

describe("money in admin forms", () => {
  it("parses euros with a comma, a dot or spaces", () => {
    expect(eurosToCents("20")).toBe(2000);
    expect(eurosToCents("20,50")).toBe(2050);
    expect(eurosToCents("20.5")).toBe(2050);
    expect(eurosToCents(" 1 200,99 ")).toBe(120099);
    // Floating point: 0.29 * 100 is 28.999…
    expect(eurosToCents("0,29")).toBe(29);
  });

  it("treats an empty optional price as no price", () => {
    expect(optionalEurosToCents("  ")).toBeNull();
    expect(optionalEurosToCents("8")).toBe(800);
  });

  it("formats cents back for the input", () => {
    expect(centsToEuros(2000)).toBe("20");
    expect(centsToEuros(2050)).toBe("20,50");
    expect(centsToEuros(null)).toBe("");
    expect(eurosToCents(centsToEuros(1999))).toBe(1999);
  });
});

describe("other admin conversions", () => {
  it("handles empty values", () => {
    expect(emptyToNull("  ")).toBeNull();
    expect(emptyToNull(" a ")).toBe("a");
    expect(optionalInt("")).toBeNull();
    expect(optionalInt("12")).toBe(12);
  });

  it("converts datetime-local values in Sofia time", () => {
    expect(localDateTimeToIso("2027-05-15T18:30")).toBe("2027-05-15T15:30:00.000Z");
    expect(isoToLocalDateTime("2027-05-15T15:30:00.000Z")).toBe("2027-05-15T18:30");
    expect(isoToLocalDateTime("2027-01-01T00:00:00.000Z")).toBe("2027-01-01T02:00");
    expect(isoToLocalDateTime(null)).toBe("");
  });

  it("splits and joins feature lists", () => {
    expect(linesToList(" Едно \n\n Две ")).toEqual(["Едно", "Две"]);
    expect(listToLines(["Едно", "Две"])).toBe("Едно\nДве");
    expect(listToLines("not a list")).toBe("");
  });

  it("transliterates Bulgarian titles into slugs", () => {
    expect(slugify("Клуб „Красота, стил и естетика“")).toBe("klub-krasota-stil-i-estetika");
    expect(slugify("Щастие и юмор: Жени в бизнеса 2027")).toBe("shtastie-i-yumor-zheni-v-biznesa-2027");
    expect(slugify("---")).toBe("");
    expect(slugify("а".repeat(100))).toHaveLength(80);
  });
});

describe("specialist schedule", () => {
  const hours = { weekdays: [1, 3], start: "09:00", end: "17:00", validFrom: "", validUntil: "" };

  it("accepts weekly hours and builds one row per weekday", () => {
    expect(availabilitySchema.safeParse(hours).success).toBe(true);
    expect(availabilityRows("s1", hours)).toEqual([
      { specialist_id: "s1", weekday: 1, start_time: "09:00", end_time: "17:00", valid_from: null, valid_until: null },
      { specialist_id: "s1", weekday: 3, start_time: "09:00", end_time: "17:00", valid_from: null, valid_until: null },
    ]);
  });

  it("rejects end before start, empty weekdays and reversed date ranges", () => {
    expect(availabilitySchema.safeParse({ ...hours, end: "08:00" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...hours, weekdays: [] }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...hours, start: "24:00" }).success).toBe(false);
    expect(availabilitySchema.safeParse({ ...hours, validFrom: "2027-02-01", validUntil: "2027-01-01" }).success).toBe(false);
  });

  it("stores time off in UTC", () => {
    const input = { startsAt: "2027-08-01T09:00", endsAt: "2027-08-14T18:00", reason: "  " };
    expect(timeOffSchema.safeParse(input).success).toBe(true);
    expect(timeOffSchema.safeParse({ ...input, endsAt: "2027-07-01T09:00" }).success).toBe(false);
    expect(timeOffRow("s1", input)).toEqual({
      specialist_id: "s1",
      starts_at: "2027-08-01T06:00:00.000Z",
      ends_at: "2027-08-14T15:00:00.000Z",
      reason: null,
    });
  });
});
