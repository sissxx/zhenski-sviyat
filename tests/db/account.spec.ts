import { expect, test } from "@playwright/test";
import { createUser, db, login, password, unique } from "./support";

test.describe("accounts", () => {
  test("sign-up creates the profile and signs the visitor in", async ({ page }) => {
    const email = `signup-${unique()}@example.org`;
    await page.goto("/registratsiya");
    await page.getByLabel("Име", { exact: true }).fill("Елена");
    await page.getByLabel("Фамилия").fill("Тестова");
    await page.getByRole("textbox", { name: "Имейл" }).fill(email);
    await page.getByLabel("Телефон (по желание)").fill("+359 888 123 456");
    await page.getByLabel("Парола", { exact: true }).fill(password);
    await page.getByLabel("Повтори паролата").fill(password);
    await page.getByRole("checkbox", { name: /Политиката за поверителност/ }).check();
    await page.getByRole("button", { name: "Създай профил" }).click();

    // Email confirmation is off in the local Supabase, so sign-up goes straight to the account.
    await expect(page).toHaveURL((url) => url.pathname === "/profil");
    const { data: profile } = await db.from("profiles").select("first_name, last_name, phone, terms_accepted_at").eq("email", email).single();
    expect(profile).toMatchObject({ first_name: "Елена", last_name: "Тестова", phone: "+359 888 123 456" });
    expect(profile?.terms_accepted_at).not.toBeNull();
  });

  test("account pages need a login and come back after it", async ({ page }) => {
    const user = await createUser();
    await page.goto("/profil/sabitiya");
    await expect(page).toHaveURL(/\/vhod\?next=%2Fprofil%2Fsabitiya/);
    await page.getByRole("textbox", { name: "Имейл" }).fill(user.email);
    await page.getByLabel("Парола", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Вход", exact: true }).click();
    await expect(page).toHaveURL(/\/profil\/sabitiya$/);
    await expect(page.getByText("Все още нямаш записвания.")).toBeVisible();
  });

  test("a wrong password is refused", async ({ page }) => {
    const user = await createUser();
    await page.goto("/vhod");
    await page.getByRole("textbox", { name: "Имейл" }).fill(user.email);
    await page.getByLabel("Парола", { exact: true }).fill("Greshna-parola-1");
    await page.getByRole("button", { name: "Вход", exact: true }).click();
    await expect(page.getByText("Грешен имейл или парола.")).toBeVisible();
    await expect(page).toHaveURL(/\/vhod/);
  });

  test("a member edits her details", async ({ page }) => {
    const user = await createUser();
    await login(page, user, "/profil/danni");
    await page.getByLabel("Фамилия").fill("Нова фамилия");
    await page.getByLabel("Телефон").fill("+359 877 000 111");
    await page.getByRole("button", { name: "Запази промените" }).click();
    await expect(page.getByText("Данните са запазени.")).toBeVisible();

    const { data } = await db.from("profiles").select("last_name, phone").eq("id", user.id).single();
    expect(data).toEqual({ last_name: "Нова фамилия", phone: "+359 877 000 111" });
  });

  test("logging out ends the session", async ({ page }) => {
    const user = await createUser();
    await login(page, user);
    await page.getByRole("button", { name: "Изход" }).first().click();
    await expect(page).toHaveURL((url) => url.pathname === "/");
    await page.goto("/profil");
    await expect(page).toHaveURL(/\/vhod/);
  });
});
