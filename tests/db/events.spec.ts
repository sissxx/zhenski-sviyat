import { expect, test } from "@playwright/test";
import { createEvent, createUser, db, login, password } from "./support";

test.describe("events", () => {
  test("lists published events and hides drafts", async ({ page }) => {
    const published = await createEvent();
    const draft = await createEvent({ status: "draft", published_at: null });
    await page.goto("/sabitiya");
    await expect(page.getByRole("link", { name: published.title }).first()).toBeVisible();
    await expect(page.getByText(draft.title)).toHaveCount(0);

    await page.goto(`/sabitiya/${draft.slug}`);
    await expect(page.getByRole("heading", { name: draft.title })).toHaveCount(0);
  });

  test("a visitor logs in from the sign-up page and comes back to it", async ({ page }) => {
    const [user, event] = await Promise.all([createUser(), createEvent()]);
    await page.goto(`/sabitiya/${event.slug}`);
    await page.getByRole("link", { name: "Запиши се" }).click();
    await expect(page).toHaveURL(`/sabitiya/${event.slug}/zapisvane`);
    await page.getByRole("main").getByRole("link", { name: "Вход", exact: true }).click();

    await page.getByRole("textbox", { name: "Имейл" }).fill(user.email);
    await page.getByLabel("Парола", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Вход", exact: true }).click();
    await expect(page).toHaveURL(`/sabitiya/${event.slug}/zapisvane`);
    await expect(page.getByRole("button", { name: "Запиши се" })).toBeVisible();
  });

  test("free event: sign up, see it in the account, cancel", async ({ page }) => {
    const user = await createUser();
    const event = await createEvent({ capacity: 5 });
    await login(page, user, `/sabitiya/${event.slug}/zapisvane`);
    await page.getByRole("button", { name: "Запиши се" }).click();

    await expect(page).toHaveURL(new RegExp(`/sabitiya/${event.slug}/potvarzhdenie\\?zapisvane=`));
    await expect(page.getByRole("heading", { name: "Мястото ти е запазено" })).toBeVisible();

    const { data: listing } = await db.from("event_listing").select("seats_left").eq("id", event.id).single();
    expect(listing?.seats_left).toBe(4);

    await page.goto("/profil/sabitiya");
    const card = page.locator("li").filter({ hasText: event.title });
    await expect(card.getByText("Потвърдено")).toBeVisible();
    await card.getByRole("button", { name: "Откажи участие" }).click();
    await card.getByRole("button", { name: "Да, откажи" }).click();
    await expect(page.locator("li").filter({ hasText: event.title }).getByText("Отказано")).toBeVisible();

    const { data: registration } = await db.from("event_registrations").select("status").eq("event_id", event.id).eq("user_id", user.id).single();
    expect(registration?.status).toBe("cancelled");
  });

  test("a full event can't be joined", async ({ page }) => {
    const [first, second] = await Promise.all([createUser(), createUser()]);
    const event = await createEvent({ capacity: 1 });
    await db.from("event_registrations").insert({ event_id: event.id, user_id: first.id, status: "confirmed", price_cents: 0 }).throwOnError();

    await login(page, second, `/sabitiya/${event.slug}`);
    await expect(page.getByRole("button", { name: "Няма свободни места" })).toBeDisabled();
  });

  test("paid event by bank transfer: pending until an admin confirms the transfer", async ({ page, browser }) => {
    const [member, admin] = await Promise.all([createUser(), createUser({ admin: true })]);
    const event = await createEvent({ price_cents: 2500, allow_bank_transfer: true });

    await login(page, member, `/sabitiya/${event.slug}/zapisvane`);
    await page.getByRole("radio", { name: /Банков превод/ }).check();
    await page.getByRole("button", { name: /Заяви участие/ }).click();

    await expect(page.getByRole("heading", { name: "Заявката чака плащане" })).toBeVisible();
    const bank = page.locator('[aria-labelledby="bank-title"]');
    await expect(bank.getByText("BG80BNBG96611020345678")).toBeVisible();
    await expect(bank.getByText(/^25\s€$/)).toBeVisible();

    const { data: payment } = await db
      .from("payments")
      .select("id, status, provider, amount_cents, bank_reference, event_registrations!inner(event_id)")
      .eq("event_registrations.event_id", event.id)
      .single();
    expect(payment).toMatchObject({ status: "pending", provider: "bank_transfer", amount_cents: 2500 });
    expect(payment?.bank_reference).toMatch(/^NSJS-/);
    await expect(bank.getByText(payment!.bank_reference!)).toBeVisible();

    // The admin sees the transfer under "Чакащи преводи" and confirms it.
    const adminPage = await (await browser.newContext()).newPage();
    await login(adminPage, admin, "/admin/plashtaniya");
    const row = adminPage.getByRole("row").filter({ hasText: payment!.bank_reference! });
    await row.getByRole("button", { name: "Потвърди превода" }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByRole("button", { name: "Потвърди", exact: true }).click();
    // The dialog closes when the action is done, and the payment leaves "Чакащи преводи". (While the dialog is
    // open the table is aria-hidden, so the row only counts as gone after the dialog has closed.)
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Плащането е потвърдено" })).toBeVisible();
    const { data: registration } = await db.from("event_registrations").select("status").eq("event_id", event.id).single();
    expect(registration?.status).toBe("confirmed");
  });

  test("the online link is shown only to confirmed attendees", async ({ page }) => {
    const user = await createUser();
    const event = await createEvent({ format: "online", city: null });
    await db.from("event_private_details").insert({ event_id: event.id, online_url: "https://meet.example.org/test-link" });

    await login(page, user, `/sabitiya/${event.slug}`);
    await expect(page.getByText("https://meet.example.org/test-link")).toHaveCount(0);
    await page.goto(`/sabitiya/${event.slug}/zapisvane`);
    await page.getByRole("button", { name: "Запиши се" }).click();
    await expect(page.getByRole("link", { name: "https://meet.example.org/test-link" })).toBeVisible();
  });
});
