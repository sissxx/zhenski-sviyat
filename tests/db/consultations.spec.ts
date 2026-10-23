import { expect, test, type Page } from "@playwright/test";
import { clientFor, createConsultationService, createUser, db, login } from "./support";

/** Picks the first free time on the first day shown and returns its accessible name ("<day>, <time>"). */
async function pickFirstSlot(page: Page) {
  const slot = page.getByRole("radiogroup", { name: "Час" }).getByRole("radio").first();
  await expect(slot).toBeVisible();
  const label = await slot.getAttribute("aria-label");
  await slot.click();
  return label!;
}

async function bookingsOf(userId: string) {
  const { data } = await db.from("consultation_bookings").select("id, status, starts_at, payment_method, price_cents").eq("user_id", userId);
  return data ?? [];
}

test.describe("consultations", () => {
  test("a visitor sees the free times and is asked to log in to book", async ({ page }) => {
    const { service } = await createConsultationService();
    await page.goto(`/konsultatsii?usluga=${service.slug}`);
    await expect(page.getByRole("radiogroup", { name: "Час" }).getByRole("radio").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Вход", exact: true }).last()).toHaveAttribute(
      "href",
      `/vhod?next=${encodeURIComponent(`/konsultatsii?usluga=${service.slug}`)}`,
    );
  });

  test("free consultation: book a time, and it is no longer offered to others", async ({ page }) => {
    const [member, other] = await Promise.all([createUser(), createUser()]);
    const { service, specialist } = await createConsultationService();

    await login(page, member, `/konsultatsii?usluga=${service.slug}`);
    await pickFirstSlot(page);
    await page.getByLabel("Бележка (по желание)").fill("Искам да говорим за кариера.");
    await page.getByRole("button", { name: "Запази час" }).click();

    await expect(page).toHaveURL(/\/konsultatsii\/potvarzhdenie\?zapis=/);
    await expect(page.getByRole("heading", { name: "Часът ти е запазен" })).toBeVisible();
    const [booking] = await bookingsOf(member.id);
    expect(booking).toMatchObject({ status: "confirmed", price_cents: 0 });

    // Another member can't take the same time, neither from the list nor by calling the database directly.
    const otherClient = await clientFor(other);
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const { data: slots } = await otherClient.rpc("get_available_slots", {
      p_consultation_type_id: service.id,
      p_specialist_id: specialist.id,
      p_from: from,
      p_to: to,
    });
    expect(slots?.length).toBeGreaterThan(0);
    expect(slots?.some((s) => new Date(s.starts_at).getTime() === new Date(booking.starts_at).getTime())).toBe(false);
    const { error } = await otherClient.rpc("book_consultation", {
      p_consultation_type_id: service.id,
      p_specialist_id: specialist.id,
      p_starts_at: booking.starts_at,
    });
    expect(error?.message).toMatch(/slot/);
  });

  test("a member moves a booking to another time, then cancels it", async ({ page }) => {
    const member = await createUser();
    const { service } = await createConsultationService();
    await login(page, member, `/konsultatsii?usluga=${service.slug}`);
    await pickFirstSlot(page);
    await page.getByRole("button", { name: "Запази час" }).click();
    await expect(page.getByRole("heading", { name: "Часът ти е запазен" })).toBeVisible();
    const [before] = await bookingsOf(member.id);

    await page.goto("/profil/konsultatsii");
    const card = page.locator("li").filter({ hasText: service.name });
    await expect(card.getByText("Потвърдена")).toBeVisible();
    await card.getByRole("link", { name: "Премести" }).click();
    await pickFirstSlot(page);
    await page.getByRole("button", { name: "Премести в избрания час" }).click();
    await expect(page).toHaveURL(/\/profil\/konsultatsii\?premestena=1/);

    const [moved] = await bookingsOf(member.id);
    expect(moved.id).toBe(before.id);
    expect(moved.starts_at).not.toBe(before.starts_at);

    await card.getByRole("button", { name: "Откажи", exact: true }).click();
    await card.getByRole("button", { name: "Да, откажи" }).click();
    await expect(page.locator("li").filter({ hasText: service.name }).getByText("Отказана")).toBeVisible();
    const [cancelled] = await bookingsOf(member.id);
    expect(cancelled.status).toBe("cancelled");
  });

  test("prepaid consultation by bank transfer: the admin rejects a transfer that never came", async ({ page, browser }) => {
    const [member, admin] = await Promise.all([createUser(), createUser({ admin: true })]);
    const { service } = await createConsultationService({ priceCents: 4000, requiresPrepayment: true, allowBankTransfer: true });

    await login(page, member, `/konsultatsii?usluga=${service.slug}`);
    await pickFirstSlot(page);
    await page.getByRole("radio", { name: /Банков превод/ }).check();
    await page.getByRole("button", { name: "Заяви час и плати с превод" }).click();
    await expect(page.getByRole("heading", { name: "Заявката чака плащане" })).toBeVisible();
    await expect(page.locator('[aria-labelledby="bank-title"]').getByText(/^40\s€$/)).toBeVisible();

    const [booking] = await bookingsOf(member.id);
    expect(booking).toMatchObject({ status: "pending_payment", payment_method: "bank_transfer", price_cents: 4000 });
    const { data: payment } = await db.from("payments").select("bank_reference").eq("consultation_booking_id", booking.id).single();

    const adminPage = await (await browser.newContext()).newPage();
    await login(adminPage, admin, "/admin/plashtaniya");
    const row = adminPage.getByRole("row").filter({ hasText: payment!.bank_reference! });
    await expect(row.getByText(`Консултация: ${service.name}`)).toBeVisible();
    await row.getByRole("button", { name: "Отхвърли" }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByLabel("Причина").fill("Няма превод");
    await dialog.getByRole("button", { name: "Отхвърли" }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);

    const [released] = await bookingsOf(member.id);
    expect(["cancelled", "expired"]).toContain(released.status);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Заявката не е активна" })).toBeVisible();
  });
});
