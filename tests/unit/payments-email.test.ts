import { afterEach, describe, expect, it, vi } from "vitest";
import { dbErrorKey, dbErrorMessage, genericDbError } from "@/lib/db-errors";
import { escapeHtml, renderEmail } from "@/lib/email/layout";
import { formatWhen } from "@/lib/email/templates";
import { checkoutReturnPaths, confirmationPathFor } from "@/lib/payments/paths";
import { idOf, isStripeConfigured, isoFromUnix } from "@/lib/stripe/server";
import { plain } from "./helpers";

describe("database error messages", () => {
  it("translates known business errors", () => {
    expect(dbErrorMessage({ code: "P0001", message: "event_full" })).toBe("Всички места за това събитие са заети.");
    expect(dbErrorKey({ code: "P0001", message: "event_full" })).toBe("event_full");
  });

  it("falls back to a generic message and never shows raw errors", () => {
    expect(dbErrorMessage({ code: "P0001", message: "something_new" })).toBe(genericDbError);
    expect(dbErrorMessage({ code: "23505", message: "duplicate key value violates unique constraint" })).toBe(genericDbError);
    expect(dbErrorMessage(null)).toBe(genericDbError);
    expect(dbErrorKey({ code: "23505", message: "event_full" })).toBeUndefined();
  });
});

describe("checkout return paths", () => {
  it("returns events and consultations to their confirmation pages", () => {
    expect(confirmationPathFor({ eventSlug: "sreshta", registrationId: "r1" })).toBe("/sabitiya/sreshta/potvarzhdenie?zapisvane=r1");
    expect(confirmationPathFor({ bookingId: "b1" })).toBe("/konsultatsii/potvarzhdenie?zapis=b1");
  });

  it("adds the Stripe session placeholder and the cancel flag as extra query parameters", () => {
    expect(checkoutReturnPaths({ bookingId: "b1" })).toEqual({
      successPath: "/konsultatsii/potvarzhdenie?zapis=b1&session_id={CHECKOUT_SESSION_ID}",
      cancelPath: "/konsultatsii/potvarzhdenie?zapis=b1&plashtane=prekasnato",
    });
  });
});

describe("Stripe settings", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("needs both the Stripe key and the Supabase secret key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(isStripeConfigured()).toBe(false);
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_abc");
    expect(isStripeConfigured()).toBe(true);
  });

  it("ignores a live key unless live payments are switched on", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_123");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_abc");
    vi.stubEnv("STRIPE_ALLOW_LIVE", "");
    expect(isStripeConfigured()).toBe(false);
    vi.stubEnv("STRIPE_ALLOW_LIVE", "true");
    expect(isStripeConfigured()).toBe(true);
  });

  it("refuses a publishable key in place of the Supabase secret key", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_publishable_abc");
    expect(isStripeConfigured()).toBe(false);
  });

  it("reads expandable ids and Unix timestamps", () => {
    expect(idOf("cus_1")).toBe("cus_1");
    expect(idOf({ id: "cus_1" })).toBe("cus_1");
    expect(idOf(null)).toBeNull();
    expect(isoFromUnix(1_800_000_000)).toBe("2027-01-15T08:00:00.000Z");
    expect(isoFromUnix(null)).toBeUndefined();
  });
});

describe("emails", () => {
  it("escapes HTML in user-provided text", () => {
    expect(escapeHtml(`<b>"Мария" & 'Ива'</b>`)).toBe("&lt;b&gt;&quot;Мария&quot; &amp; &#39;Ива&#39;&lt;/b&gt;");
  });

  it("renders HTML and plain text without leaking markup from the data", () => {
    const email = renderEmail(
      {
        subject: "Записването е потвърдено",
        preheader: "Очакваме те",
        heading: "Ти си в списъка",
        greeting: "Здравей, <script>alert(1)</script>,",
        blocks: [
          { kind: "text", text: "Първи ред\n\nВтори ред" },
          { kind: "details", rows: [{ label: "Място", value: "София" }, { label: "Празно", value: null }] },
          { kind: "button", label: "Виж събитието", url: "https://example.org/sabitiya/x?a=1&b=2" },
        ],
      },
      { siteName: "Сдружение Женски свят", siteUrl: "https://example.org", footerNote: "Получаваш този имейл, защото…" },
    );
    expect(email.subject).toBe("Записването е потвърдено");
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain('href="https://example.org/sabitiya/x?a=1&amp;b=2"');
    expect(email.html).not.toContain("Празно");
    expect(email.text).toContain("Виж събитието: https://example.org/sabitiya/x?a=1&b=2");
    expect(email.text).toContain("Място: София");
  });

  it("formats when an event happens", () => {
    expect(plain(formatWhen("2027-05-15T15:30:00Z", "2027-05-15T17:00:00Z"))).toBe("15 май 2027 г., 18:30 – 20:00");
    expect(plain(formatWhen("2027-05-15T15:30:00Z"))).toBe("15 май 2027 г. в 18:30");
    expect(plain(formatWhen("2027-05-15T15:30:00Z", "2027-05-16T08:00:00Z"))).toBe(
      "15 май 2027 г. в 18:30 – 16 май 2027 г. в 11:00",
    );
  });
});
