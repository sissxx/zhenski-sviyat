import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows every homepage section in order", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Заедно\s*по-силни\./);
  const sections = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(sections).toEqual([
    "Подкрепа за всяка част от твоя път",
    "Подкрепа според твоите нужди",
    "Общност, която подкрепя и вдъхновява жените.",
    "Събития, които ни събират",
    "Намери своето място в общността",
    "Хората зад общността",
    "Често задавани въпроси",
    "Бъди част от промяната.",
  ]);
});

test("hero buttons lead to consultations and events", async ({ page }) => {
  await page.getByRole("link", { name: "Намери подкрепа" }).click();
  await expect(page).toHaveURL("/konsultatsii");
  await page.goBack();
  await page.getByRole("link", { name: "Предстоящи събития" }).click();
  await expect(page).toHaveURL("/sabitiya");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("shows the membership prices in euro", async ({ page }) => {
  const membership = page.getByRole("region", { name: "Намери своето място в общността" });
  await expect(membership).toContainText(/8\s€/);
  await expect(membership).toContainText(/21\s€/);
});

test("says when no events are announced yet", async ({ page }) => {
  // Without the database there are no events; the section must still read well.
  await expect(page.getByText("Подготвяме следващите срещи. Скоро ще ги обявим тук.")).toBeVisible();
});

test("FAQ answers open and close", async ({ page }) => {
  const question = page.getByRole("button", { name: "Как мога да стана член?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

test("newsletter form checks the email address", async ({ page }) => {
  const footer = page.locator("footer");
  const send = footer.getByRole("button", { name: "Изпрати" });
  await send.click();
  await expect(footer.getByRole("status")).toHaveText("Моля, въведи валиден имейл адрес.");
  await footer.getByLabel("Абонирай се за новини").fill("maria@example.bg");
  await send.click();
  await expect(footer.getByRole("status")).toHaveText("Благодарим! Бюлетинът стартира скоро.");
});

test.describe("desktop navigation", () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "desktop"));

  test("main menu marks the current page", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Основна навигация" });
    await nav.getByRole("link", { name: "Събития" }).click();
    await expect(page).toHaveURL("/sabitiya");
    await expect(nav.getByRole("link", { name: "Събития" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Начало", exact: true })).not.toHaveAttribute("aria-current");
  });

  test("header buttons lead to login and sign-up", async ({ page }) => {
    await page.getByRole("link", { name: "Стани част от нас" }).click();
    await expect(page).toHaveURL("/registratsiya");
    await page.getByRole("link", { name: "Вход", exact: true }).first().click();
    await expect(page).toHaveURL(/\/vhod/);
  });
});

test.describe("mobile menu", () => {
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "mobile"));

  test("opens, navigates and closes", async ({ page }) => {
    const toggle = page.getByRole("button", { name: "Отвори менюто" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Мобилна навигация" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Контакти" }).click();
    await expect(page).toHaveURL("/kontakti");
    await expect(menu).toBeHidden();
  });

  test("closes with the close button", async ({ page }) => {
    await page.getByRole("button", { name: "Отвори менюто" }).click();
    await page.getByRole("button", { name: "Затвори менюто" }).click();
    await expect(page.getByRole("navigation", { name: "Мобилна навигация" })).toBeHidden();
  });
});
