import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "../../src/lib/routes";

test.use({ storageState: { cookies: [], origins: [] } });

test("the cookie notice shows once, links to the policy and stays closed", async ({ page }) => {
  await page.goto(routes.home);
  const notice = page.getByRole("region", { name: "Бисквитки" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("link", { name: "Научи повече" })).toHaveAttribute("href", routes.cookies);

  const results = await new AxeBuilder({ page }).include('[aria-label="Бисквитки"]').withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);

  await notice.getByRole("button", { name: "Разбрах" }).click();
  await expect(notice).toBeHidden();

  await page.goto(routes.events);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("region", { name: "Бисквитки" })).toHaveCount(0);
});
