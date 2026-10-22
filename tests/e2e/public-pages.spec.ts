import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { publicPages } from "./pages";

for (const path of publicPages) {
  test.describe(`page ${path}`, () => {
    test("loads with one heading, a title and no errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Женски свят/);
      await expect(page.locator("html")).toHaveAttribute("lang", "bg");
      await expect(page.locator("h1")).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });

    test("fits a 320px screen without sideways scrolling", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("has no serious accessibility problems", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Checked once, on desktop");
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
      const serious = results.violations
        .filter((v) => v.impact === "serious" || v.impact === "critical" || v.id === "heading-order")
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(serious).toEqual([]);
    });
  });
}

test("every internal link on the public pages leads somewhere", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Same links on every screen size");
  test.setTimeout(120_000);
  const hrefs = new Set<string>();
  for (const path of publicPages) {
    await page.goto(path);
    for (const href of await page.locator("a[href^='/']").evaluateAll((links) => links.map((a) => a.getAttribute("href")!))) {
      hrefs.add(href.split("#")[0]);
    }
  }
  const broken: string[] = [];
  for (const href of hrefs) {
    const response = await request.get(href);
    if (!response.ok()) broken.push(`${href} → ${response.status()}`);
  }
  expect(broken).toEqual([]);
});

test("unknown pages show the Bulgarian 404 page", async ({ page }) => {
  const response = await page.goto("/nyama-takava-stranitsa");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Страницата не е намерена/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Тази страница не е намерена");
  await page.getByRole("link", { name: "Към началото" }).click();
  await expect(page).toHaveURL("/");
});

test("account pages send visitors to the login page and back", async ({ page }) => {
  await page.goto("/profil/sabitiya");
  await expect(page).toHaveURL("/vhod?next=%2Fprofil%2Fsabitiya");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
