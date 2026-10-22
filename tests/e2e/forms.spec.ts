import { expect, test } from "@playwright/test";

test("contact form shows Bulgarian errors and keeps the subject from a package link", async ({ page }) => {
  await page.goto(`/kontakti?tema=${encodeURIComponent("Пакет Злато")}`);
  await expect(page.getByLabel("Тема")).toHaveValue("Пакет Злато");
  await page.getByRole("button", { name: "Изпрати съобщение" }).click();
  await expect(page.getByText("Моля, въведи валиден имейл адрес.").or(page.getByText("Моля, въведи имейл адрес."))).toBeVisible();
  await expect(page.getByText("Необходимо е съгласие, за да продължиш.")).toBeVisible();
});

test("sign-up form checks passwords before sending", async ({ page }) => {
  await page.goto("/registratsiya");
  await page.getByLabel("Парола", { exact: true }).fill("парола123");
  await page.getByLabel("Повтори паролата").fill("друга123");
  await page.getByRole("button", { name: "Създай профил" }).click();
  await expect(page.getByText("Паролите не съвпадат.")).toBeVisible();
});

test("login form asks for the email and password", async ({ page }) => {
  await page.goto("/vhod");
  await page.getByRole("button", { name: "Вход", exact: true }).click();
  await expect(page.getByText("Моля, въведи имейл адрес.")).toBeVisible();
  await expect(page.getByText("Моля, въведи паролата си.")).toBeVisible();
});
