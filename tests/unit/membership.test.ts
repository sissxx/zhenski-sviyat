import { describe, expect, it } from "vitest";
import { renderEmail } from "@/lib/email/layout";
import { subscriptionPendingPayment } from "@/lib/email/templates";
import { joinPlanPath, mainNav, routes, safeNextPath } from "@/lib/routes";
import { fallbackPlans, perInterval, planFeatures, toPublicPlans } from "@/lib/subscriptions/plans";
import { viberRequestSchema } from "@/lib/subscriptions/schemas";
import { plain } from "./helpers";

describe("membership page data", () => {
  it("keeps only non-empty string features", () => {
    expect(planFeatures(["Съвети", "", 3, null, "Общност"])).toEqual(["Съвети", "Общност"]);
    expect(planFeatures({ a: 1 })).toEqual([]);
    expect(planFeatures(null)).toEqual([]);
  });

  it("falls back to the content plans with the provisional Viber price marked", () => {
    const plans = fallbackPlans();
    expect(plans.map((p) => [p.slug, p.priceCents, p.priceProvisional])).toEqual([
      ["klub-krasota", 800, false],
      ["viber-obshtnost", 2100, true],
    ]);
    expect(plans.every((p) => p.id === null)).toBe(true);
  });

  it("lists only the active Viber groups of a plan", () => {
    const [plan] = toPublicPlans([
      {
        id: "p1",
        slug: "viber-obshtnost",
        name: "Viber общност",
        description: null,
        features: ["Група"],
        price_cents: 2100,
        billing_interval: "month",
        allow_bank_transfer: true,
        plan_viber_groups: [
          { viber_groups: { name: "Обща", is_active: true } },
          { viber_groups: { name: "Стара", is_active: false } },
          { viber_groups: null },
        ],
      },
    ]);
    expect(plan.viberGroups).toEqual(["Обща"]);
    expect(plan.priceProvisional).toBe(false);
    expect(perInterval(plan.billingInterval)).toBe("месец");
    expect(perInterval("year")).toBe("година");
  });
});

describe("joining a plan", () => {
  it("links to sign-up with the plan, continuing to the subscriptions page", () => {
    const url = new URL(joinPlanPath("viber-obshtnost"), "https://example.org");
    expect(url.pathname).toBe(routes.register);
    expect(url.searchParams.get("plan")).toBe("viber-obshtnost");
    expect(url.searchParams.get("next")).toBe("/profil/abonamenti?plan=viber-obshtnost");
    // A signed-in member is sent on to `next` by the proxy, so it must pass the same-site check.
    expect(safeNextPath(url.searchParams.get("next"))).toBe("/profil/abonamenti?plan=viber-obshtnost");
  });

  it("shows Членство in the main menu", () => {
    expect(mainNav).toContainEqual({ label: "Членство", href: "/chlenstvo" });
  });
});

describe("Viber number form", () => {
  it("needs a valid phone, the Viber name is optional", () => {
    expect(viberRequestSchema.safeParse({ phone: "+359 888 123 456", displayName: "" }).success).toBe(true);
    expect(viberRequestSchema.safeParse({ phone: "", displayName: "Мария" }).success).toBe(false);
    expect(viberRequestSchema.safeParse({ phone: "abc", displayName: "" }).success).toBe(false);
  });
});

describe("membership bank transfer email", () => {
  const bank = {
    amountCents: 800,
    reference: "NSJS-ABC123",
    deadline: "2026-11-01T10:00:00Z",
    beneficiary: "Сдружение Женски свят",
    iban: "BG00TEST",
    bic: "TESTBGSF",
    bankName: "Банка",
  };
  const site = { siteName: "Сдружение Женски свят", siteUrl: "https://example.org", footerNote: "" };

  it("gives the transfer details and says Viber links follow in the profile", () => {
    const content = subscriptionPendingPayment({
      firstName: "Мария",
      planName: "Клуб",
      renewal: false,
      paidUntil: null,
      accountUrl: "https://example.org/profil/abonamenti",
      bank,
    });
    const email = renderEmail(content, site);
    expect(email.subject).toBe("Членство „Клуб“: данни за плащане");
    expect(plain(email.text)).toContain("NSJS-ABC123");
    expect(plain(email.text)).toContain("Сума: 8 €");
    expect(email.text).toContain("Viber");
    expect(email.text).toContain("заявката отпада");
  });

  it("tells a renewing member access lasts to the end of the paid period", () => {
    const content = subscriptionPendingPayment({
      firstName: null,
      planName: "Клуб",
      renewal: true,
      paidUntil: "2026-11-20T10:00:00Z",
      accountUrl: "https://example.org/profil/abonamenti",
      bank,
    });
    const email = renderEmail(content, site);
    expect(email.subject).toBe("Подновяване на „Клуб“: данни за плащане");
    expect(plain(email.text)).toContain("20 ноември 2026 г.");
    expect(email.text).toContain("членството остава до края на вече платения период");
  });
});
