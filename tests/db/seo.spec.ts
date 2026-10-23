import { expect, test } from "@playwright/test";
import { DEFAULT_SITE_URL } from "../../src/lib/seo/config";
import { createEvent } from "./support";

test.describe("search and share previews of events", () => {
  test("an event page has its own title, preview image and Event data", async ({ page }) => {
    const event = await createEvent({ price_cents: 1200, venue_name: "Зала Изток" });
    await page.goto(`/sabitiya/${event.slug}`);

    // Browsers get the tags streamed in after the page; link-preview bots get them in <head> (next test).
    const head = page.locator("html");
    const url = `${DEFAULT_SITE_URL}/sabitiya/${event.slug}`;
    await expect(page).toHaveTitle(`${event.title} · Женски свят`);
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
    await expect(head.locator('meta[property="og:title"]')).toHaveAttribute("content", `${event.title} · Женски свят`);
    await expect(head.locator('meta[property="og:description"]')).toHaveAttribute("content", "Кратко описание за теста.");
    await expect(head.locator('meta[property="og:image"]')).toHaveAttribute("content", `${DEFAULT_SITE_URL}/og/sabitiya/${event.slug}`);

    const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "{}");
    expect(data).toMatchObject({
      "@type": "Event",
      name: event.title,
      url,
      location: { "@type": "Place", name: "Зала Изток", address: { addressLocality: "София" } },
      offers: { price: "12.00", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
    });
  });

  test("Facebook and Viber find the share tags in <head>", async ({ request }) => {
    const event = await createEvent();
    for (const userAgent of ["facebookexternalhit/1.1", "Mozilla/5.0 (Linux; Android 14) Viber/24.1.0.0"]) {
      const html = await (await request.get(`/sabitiya/${event.slug}`, { headers: { "User-Agent": userAgent } })).text();
      const head = html.slice(0, html.indexOf("</head>"));
      expect(head, userAgent).toContain(`<meta property="og:image" content="${DEFAULT_SITE_URL}/og/sabitiya/${event.slug}"/>`);
      expect(head, userAgent).toContain(`<meta property="og:title" content="${event.title} · Женски свят"/>`);
    }
  });

  test("the event's share image is drawn from the database", async ({ request }) => {
    const event = await createEvent();
    const image = await request.get(`/og/sabitiya/${event.slug}`);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toBe("image/png");
    const body = await image.body();
    expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([1200, 630]);

    const draft = await createEvent({ status: "draft", published_at: null });
    expect((await request.get(`/og/sabitiya/${draft.slug}`)).status()).toBe(404);
  });

  test("the sitemap lists published events and leaves drafts out", async ({ request }) => {
    const [published, draft] = await Promise.all([createEvent(), createEvent({ status: "draft", published_at: null })]);
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`${DEFAULT_SITE_URL}/sabitiya/${published.slug}`);
    expect(xml).not.toContain(draft.slug);
  });
});
