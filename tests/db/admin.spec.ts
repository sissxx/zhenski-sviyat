import { expect, test } from "@playwright/test";
import { adminRoutes } from "../../src/lib/admin/routes";
import { createEvent, createUser, db, login, unique } from "./support";

test.describe("admin panel", () => {
  test("is hidden from members and visitors", async ({ page, request }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/vhod\?next=%2Fadmin/);

    const member = await createUser();
    await login(page, member);
    await page.goto("/admin/plashtaniya");
    await expect(page.getByText("Грешка 404")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Плащания" })).toHaveCount(0);

    // The CSV export checks the role too, also without a page around it.
    const event = await createEvent();
    const csv = await page.request.get(`/admin/sabitiya/${event.id}/uchastnichki/csv`);
    expect(csv.status()).toBe(403);
    const anonymous = await request.get(`/admin/sabitiya/${event.id}/uchastnichki/csv`, { maxRedirects: 0 });
    expect([302, 303, 307, 403]).toContain(anonymous.status());
  });

  test("every admin page opens for an admin", async ({ page }) => {
    test.slow();
    const admin = await createUser({ admin: true });
    await login(page, admin, "/admin");
    for (const path of Object.values(adminRoutes)) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
      await expect(page.getByText("Нещо се обърка"), path).toHaveCount(0);
    }
  });

  test("an admin creates an event that then shows on the site", async ({ page }) => {
    const admin = await createUser({ admin: true });
    const id = unique();
    const title = `Събитие от админ ${id}`;
    const slug = `admin-sabitie-${id}`;

    await login(page, admin, "/admin/sabitiya/nov");
    await page.getByLabel("Заглавие", { exact: true }).fill(title);
    await page.getByLabel("Адрес (slug)").fill(slug);
    await page.getByRole("combobox", { name: "Статус" }).click();
    await page.getByRole("option", { name: "Публикувано" }).click();
    await page.getByLabel("Кратко описание").fill("Среща за тест.");
    await page.getByLabel("Начало", { exact: true }).fill("2027-03-10T18:00");
    await page.getByLabel("Град").fill("Пловдив");
    await page.getByLabel("Цена (€)").fill("12,50");
    await page.getByLabel("Места", { exact: true }).fill("15");
    await page.getByRole("button", { name: "Създай" }).click();
    await expect(page).toHaveURL(/\/admin\/sabitiya\/[0-9a-f-]{36}\?zapazeno=1/);

    const { data: event } = await db.from("events").select("status, price_cents, capacity, city, starts_at").eq("slug", slug).single();
    expect(event).toMatchObject({ status: "published", price_cents: 1250, capacity: 15, city: "Пловдив" });
    // Entered as Sofia time (UTC+2 in March).
    expect(new Date(event!.starts_at).toISOString()).toBe("2027-03-10T16:00:00.000Z");

    await page.goto(`/sabitiya/${slug}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });

  test("an admin sees who signed up and exports the list", async ({ page }) => {
    const [admin, member] = await Promise.all([createUser({ admin: true }), createUser()]);
    const event = await createEvent();
    await db.from("event_registrations").insert({ event_id: event.id, user_id: member.id, status: "confirmed", price_cents: 0 }).throwOnError();

    await login(page, admin, `/admin/sabitiya/${event.id}/uchastnichki`);
    await expect(page.getByText(member.email)).toBeVisible();

    const csv = await page.request.get(`/admin/sabitiya/${event.id}/uchastnichki/csv`);
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body).toContain(`"${member.email}"`);
    expect(body).toContain('"Потвърдено"');
  });

  test("an admin changes the bank details shown to payers and sees the reminder timing", async ({ page }) => {
    const admin = await createUser({ admin: true });
    await login(page, admin, "/admin/nastroyki");
    await expect(page.getByLabel("Преди консултация (часа)")).toHaveValue("24");
    await expect(page.getByLabel("Преди събитие (часа)")).toHaveValue("24");
    await expect(page.getByLabel("Преди края на платен месец по банков път (дни)")).toHaveValue("5");
    const field = page.getByLabel("Банка", { exact: true });
    const original = await field.inputValue();
    await field.fill("Банка за теста");
    await page.getByRole("button", { name: "Запази настройките" }).click();
    await expect(page.getByText("Промените са запазени.")).toBeVisible();
    const { data } = await db.from("app_settings").select("bank_transfer_bank_name").eq("id", true).single();
    expect(data?.bank_transfer_bank_name).toBe("Банка за теста");
    await db.from("app_settings").update({ bank_transfer_bank_name: original }).eq("id", true);
  });
});
