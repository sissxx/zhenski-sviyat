import { expect, test } from "@playwright/test";
import { routes } from "../../src/lib/routes";

test("membership page shows both plans with euro prices and the provisional mark", async ({ page }) => {
  await page.goto(routes.membership);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Стани член на общността");
  const club = page.getByRole("region", { name: "Клуб „Красота, стил и естетика“" });
  const viber = page.getByRole("region", { name: "Затворена Viber общност" });
  await expect(club).toContainText(/8\s€/);
  await expect(viber).toContainText(/21\s€/);
  await expect(viber.locator("[data-placeholder]")).toContainText("Окончателната цена");
  await expect(club.locator("[data-placeholder]")).toHaveCount(0);
});

test("Стани член leads to sign-up with the plan chosen", async ({ page }) => {
  await page.goto(routes.membership);
  await page.getByRole("region", { name: "Затворена Viber общност" }).getByRole("link", { name: "Стани член" }).click();
  await expect(page).toHaveURL(/\/registratsiya\?plan=viber-obshtnost/);
  await expect(page.getByText("активираш членството „Затворена Viber общност“")).toBeVisible();
});
