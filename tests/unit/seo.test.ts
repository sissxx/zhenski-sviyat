import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicEvent } from "@/lib/events/types";
import { routes } from "@/lib/routes";
import { absoluteUrl, DEFAULT_SITE_URL, isIndexable, siteUrl } from "@/lib/seo/config";
import { eventMetadata, pageMetadata } from "@/lib/seo/metadata";
import { eventImagePath, pageImagePath, sharePages, type SharePageKey } from "@/lib/seo/pages";
import { eventJsonLd, organizationJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";

const event = (overrides: Partial<PublicEvent> = {}): PublicEvent => ({
  id: "e1",
  slug: "sreshta",
  title: "Среща за жени",
  summary: "Разговор с психолог.",
  description: null,
  startsAt: "2027-05-15T15:30:00Z",
  endsAt: "2027-05-15T17:30:00Z",
  format: "in_person",
  venueName: "Зала 1",
  venueAddress: "ул. Шипка 1",
  city: "София",
  priceCents: 1500,
  capacity: 20,
  seatsLeft: 5,
  allowBankTransfer: true,
  registrationOpensAt: null,
  availability: "open",
  ...overrides,
});

afterEach(() => vi.unstubAllEnvs());

describe("site address and indexing", () => {
  it("uses the Vercel address until a domain is configured", () => {
    expect(siteUrl({})).toBe(DEFAULT_SITE_URL);
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://zhenskisviat.org/" })).toBe("https://zhenskisviat.org");
    expect(absoluteUrl("/za-nas", { NEXT_PUBLIC_SITE_URL: "https://zhenskisviat.org" })).toBe("https://zhenskisviat.org/za-nas");
  });

  it("lets search engines in only on the production deployment", () => {
    expect(isIndexable({ VERCEL_ENV: "production" })).toBe(true);
    expect(isIndexable({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: "development" })).toBe(false);
    expect(isIndexable({})).toBe(false);
  });
});

describe("page metadata", () => {
  const keys = Object.keys(sharePages) as SharePageKey[];

  it("covers known public routes, each once", () => {
    const paths = keys.map((key) => sharePages[key].path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) expect(Object.values(routes)).toContain(path);
    expect(paths).not.toContain(routes.login);
    expect(paths).not.toContain(routes.account);
  });

  it("gives every page a description short enough for search results and previews", () => {
    for (const key of keys) {
      expect(sharePages[key].description.length, key).toBeGreaterThan(40);
      expect(sharePages[key].description.length, key).toBeLessThanOrEqual(160);
    }
  });

  it("sets the canonical URL, Open Graph and Twitter tags with the page's own image", () => {
    const metadata = pageMetadata("about");
    expect(metadata.title).toBe("За нас");
    expect(metadata.alternates?.canonical).toBe(routes.about);
    expect(metadata.openGraph).toMatchObject({
      url: routes.about,
      locale: "bg_BG",
      siteName: "Сдружение Женски свят",
      title: "За нас · Женски свят",
      images: [{ url: pageImagePath("about"), width: 1200, height: 630, type: "image/png" }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [{ url: "/og/about" }] });
  });

  it("keeps the homepage title as is", () => {
    expect(pageMetadata("home").title).toEqual({ absolute: "Сдружение Женски свят — Път към себе си" });
  });

  it("describes an event by its summary, or by date and place without one", () => {
    expect(eventMetadata(event()).description).toBe("Разговор с психолог.");
    expect(eventMetadata(event({ summary: null })).description).toMatch(/^Среща за жени: 15 май 2027.* · София · присъствено\.$/);
    expect(eventMetadata(event()).alternates?.canonical).toBe("/sabitiya/sreshta");
    expect(eventMetadata(event()).openGraph?.images).toMatchObject([{ url: eventImagePath("sreshta") }]);
  });
});

describe("structured data", () => {
  it("describes the association without inventing contacts", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://zhenskisviat.org");
    const org = organizationJsonLd();
    expect(org).toMatchObject({ "@type": "NGO", name: "Сдружение Женски свят", url: "https://zhenskisviat.org/" });
    expect(org).not.toHaveProperty("telephone");
    expect(org).not.toHaveProperty("sameAs");
  });

  it("describes an in-person paid event", () => {
    const data = eventJsonLd(event());
    expect(data).toMatchObject({
      "@type": "Event",
      name: "Среща за жени",
      startDate: "2027-05-15T15:30:00Z",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      isAccessibleForFree: false,
      location: { "@type": "Place", name: "Зала 1", address: { streetAddress: "ул. Шипка 1", addressLocality: "София", addressCountry: "BG" } },
      offers: { price: "15.00", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
    });
  });

  it("never exposes the private online link", () => {
    const online = eventJsonLd(event({ format: "online", priceCents: 0 }));
    expect(online.location).toEqual({ "@type": "VirtualLocation", url: expect.stringMatching(/\/sabitiya\/sreshta$/) });
    expect(online.isAccessibleForFree).toBe(true);
    const hybrid = eventJsonLd(event({ format: "hybrid" }));
    expect(hybrid.location).toHaveLength(2);
  });

  it("marks cancelled and full events", () => {
    expect(eventJsonLd(event({ availability: "cancelled" })).eventStatus).toBe("https://schema.org/EventCancelled");
    expect(eventJsonLd(event({ availability: "full" })).offers).toMatchObject({ availability: "https://schema.org/SoldOut" });
    expect(eventJsonLd(event({ availability: "past" })).offers).not.toHaveProperty("availability");
  });

  it("can't be broken out of its script tag", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
