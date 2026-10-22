import { describe, expect, it } from "vitest";
import {
  bookingPriceLabel,
  paymentModeOf,
  servicePriceLabel,
  specialistLabel,
  type ConsultationService,
} from "@/lib/consultations/types";
import { eventLocationLabel, eventPriceLabel, toPublicEvent } from "@/lib/events/types";
import { plain } from "./helpers";

type ListingRow = Parameters<typeof toPublicEvent>[0];

const now = Date.parse("2027-05-01T12:00:00Z");

const row = (overrides: Partial<ListingRow> = {}): ListingRow =>
  ({
    id: "e1",
    slug: "sreshta",
    title: "Среща",
    summary: null,
    description: null,
    starts_at: "2027-05-15T15:30:00Z",
    ends_at: null,
    format: "in_person",
    venue_name: null,
    venue_address: null,
    city: "София",
    price_cents: 0,
    capacity: 20,
    seats_left: 5,
    allow_bank_transfer: true,
    registration_opens_at: null,
    registration_open: true,
    is_full: false,
    status: "published",
    ...overrides,
  }) as ListingRow;

describe("event availability", () => {
  it("is open for an upcoming published event", () => {
    expect(toPublicEvent(row(), now).availability).toBe("open");
  });

  it("puts cancelled before past, and past before full", () => {
    expect(toPublicEvent(row({ status: "cancelled", starts_at: "2027-04-01T00:00:00Z" }), now).availability).toBe("cancelled");
    expect(toPublicEvent(row({ starts_at: "2027-04-01T00:00:00Z", is_full: true }), now).availability).toBe("past");
    expect(toPublicEvent(row({ status: "completed" }), now).availability).toBe("past");
    expect(toPublicEvent(row({ is_full: true }), now).availability).toBe("full");
  });

  it("knows when sign-up has not opened yet or is closed", () => {
    expect(toPublicEvent(row({ registration_opens_at: "2027-05-10T00:00:00Z", registration_open: false }), now).availability).toBe(
      "not_open_yet",
    );
    expect(toPublicEvent(row({ registration_open: false }), now).availability).toBe("closed");
  });

  it("fills defaults for nullable view columns", () => {
    const event = toPublicEvent(row({ format: null, price_cents: null, allow_bank_transfer: null }), now);
    expect(event).toMatchObject({ format: "in_person", priceCents: 0, allowBankTransfer: false });
  });
});

describe("event labels", () => {
  it("describes the place", () => {
    expect(eventLocationLabel({ format: "online", city: "София" })).toBe("Онлайн");
    expect(eventLocationLabel({ format: "in_person", city: "Пловдив" })).toBe("Пловдив · присъствено");
    expect(eventLocationLabel({ format: "hybrid", city: "София" })).toBe("София · на живо и онлайн");
    expect(eventLocationLabel({ format: "in_person", city: null })).toBe("Мястото предстои · присъствено");
  });

  it("shows free events as free", () => {
    expect(eventPriceLabel({ priceCents: 0 })).toBe("Безплатно");
    expect(plain(eventPriceLabel({ priceCents: 1500 }))).toBe("15 €");
  });
});

describe("consultation payments", () => {
  const service = (priceCents: number[], requiresPrepayment = true, allowBankTransfer = true): ConsultationService => ({
    id: "c1",
    slug: "psiholog",
    name: "Психолог",
    description: null,
    durationMinutes: 50,
    locationInfo: null,
    requiresPrepayment,
    allowBankTransfer,
    specialists: priceCents.map((price, i) => ({ id: `s${i}`, slug: `s${i}`, name: `Специалист ${i}`, title: null, priceCents: price })),
  });

  it("picks how a booking is paid", () => {
    expect(paymentModeOf(service([]), 0)).toBe("free");
    expect(paymentModeOf(service([], false), 4000)).toBe("on_site");
    expect(paymentModeOf(service([], true, true), 4000)).toBe("bank");
    expect(paymentModeOf(service([], true, false), 4000)).toBe("card_only");
  });

  it("labels the price range of a service", () => {
    expect(servicePriceLabel(service([]))).toBe("");
    expect(servicePriceLabel(service([0, 0]))).toBe("Безплатно");
    expect(plain(servicePriceLabel(service([4000, 4000])))).toBe("40 €");
    expect(plain(servicePriceLabel(service([4000, 3000])))).toBe("от 30 €");
    expect(plain(servicePriceLabel(service([0, 3000])))).toBe("от 0 €");
  });

  it("labels a booking price", () => {
    expect(bookingPriceLabel(4000, "free")).toBe("Безплатно");
    expect(plain(bookingPriceLabel(4000, "on_site"))).toBe("40 € · плащане на място");
    expect(plain(bookingPriceLabel(4000, "bank"))).toBe("40 €");
  });

  it("adds the specialist's title when there is one", () => {
    expect(specialistLabel({ name: "Мария Петрова", title: "психолог" })).toBe("Мария Петрова, психолог");
    expect(specialistLabel({ name: "Мария Петрова", title: null })).toBe("Мария Петрова");
  });
});
