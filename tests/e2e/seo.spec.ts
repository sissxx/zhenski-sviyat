import { expect, test, type APIResponse } from "@playwright/test";
import { DEFAULT_SITE_URL } from "../../src/lib/seo/config";
import { sharePages, type SharePageKey } from "../../src/lib/seo/pages";

// Search and share tags are the same on every screen size.
test.skip(({ isMobile }) => isMobile, "Checked once, on desktop");

/** Width and height from a PNG's header. */
async function pngSize(response: APIResponse) {
  const body = await response.body();
  expect(body.subarray(1, 4).toString("latin1")).toBe("PNG");
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
}

const keys = Object.keys(sharePages) as SharePageKey[];

test("every public page has its own canonical URL, description and share preview", async ({ page }) => {
  test.setTimeout(120_000);
  for (const key of keys) {
    const { path, description } = sharePages[key];
    await page.goto(path);
    const head = page.locator("head");
    // Next.js writes the homepage as the bare origin.
    const url = path === "/" ? DEFAULT_SITE_URL : `${DEFAULT_SITE_URL}${path}`;
    await expect(head.locator('link[rel="canonical"]'), key).toHaveAttribute("href", url);
    await expect(head.locator('meta[name="description"]'), key).toHaveAttribute("content", description);
    await expect(head.locator('meta[property="og:url"]'), key).toHaveAttribute("content", url);
    await expect(head.locator('meta[property="og:image"]'), key).toHaveAttribute("content", `${DEFAULT_SITE_URL}/og/${key}`);
    await expect(head.locator('meta[property="og:image:width"]'), key).toHaveAttribute("content", "1200");
    await expect(head.locator('meta[property="og:locale"]'), key).toHaveAttribute("content", "bg_BG");
    await expect(head.locator('meta[name="twitter:card"]'), key).toHaveAttribute("content", "summary_large_image");
    expect(await head.locator('meta[property="og:title"]').getAttribute("content"), key).toMatch(/Женски свят/);
  }
});

test("share images are 1200×630 PNGs", async ({ request }) => {
  for (const key of keys) {
    const response = await request.get(`/og/${key}`);
    expect(response.status(), key).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(await pngSize(response), key).toEqual({ width: 1200, height: 630 });
  }
  expect((await request.get("/og/nyama-takava")).status()).toBe(404);
});

test("a build that isn't production stays out of search engines", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toMatch(/User-Agent: \*\s+Disallow: \/\s*$/);

  const response = await page.goto("/za-nas");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("the sitemap lists the public pages and not the private ones", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for (const key of keys) expect(xml, key).toContain(`<loc>${DEFAULT_SITE_URL}${sharePages[key].path}</loc>`);
  expect(xml).not.toContain("/profil");
  expect(xml).not.toContain("/vhod");
});

test("the homepage describes the association for search engines", async ({ page }) => {
  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const data = blocks.flatMap((text) => JSON.parse(text));
  expect(data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ "@type": "NGO", name: "Сдружение Женски свят", url: `${DEFAULT_SITE_URL}/` }),
      expect.objectContaining({ "@type": "WebSite" }),
    ]),
  );
});
