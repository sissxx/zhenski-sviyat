import { expect, test, type Page } from "@playwright/test";
import { createPlanWithViberGroup, createUser, db, login } from "./support";

const heading = (page: Page, name: string) => page.getByRole("heading", { name, exact: true });
/** A plan on offer: its heading sits right in the panel. */
const planCard = (page: Page, name: string) => heading(page, name).last().locator("xpath=..");
/** A subscription or Viber group: the heading shares a row with its status chip. */
const statusCard = (page: Page, name: string) => heading(page, name).first().locator("xpath=../..");

test.describe("membership", () => {
  test("the membership page lists the active plans from the database", async ({ page }) => {
    const { plan } = await createPlanWithViberGroup({ priceCents: 1200 });
    const { plan: hidden } = await createPlanWithViberGroup();
    await db.from("membership_plans").update({ is_active: false }).eq("id", hidden.id);

    await page.goto("/chlenstvo");
    await expect(page.getByRole("heading", { name: plan.name })).toBeVisible();
    await expect(page.getByText(hidden.name)).toHaveCount(0);
  });

  test("bank transfer: request, admin confirms, the Viber group opens", async ({ page, browser }) => {
    const [member, admin] = await Promise.all([createUser({ phone: "+359 888 555 444" }), createUser({ admin: true })]);
    const { plan, group, inviteLink } = await createPlanWithViberGroup();

    await login(page, member, `/profil/abonamenti?plan=${plan.slug}`);
    await expect(page.getByText("Линковете към Viber групите се появяват тук, когато имаш активно членство.")).toBeVisible();
    await planCard(page, plan.name).getByRole("button", { name: "Банков превод" }).click();

    await expect(page).toHaveURL(/\/profil\/abonamenti\?prevod=/);
    const subscription = statusCard(page, plan.name);
    await expect(subscription.getByText("Чака превод")).toBeVisible();
    await expect(subscription.getByText(/^8\s€$/)).toBeVisible();
    // No access before the money arrives.
    await expect(page.getByRole("link", { name: "Влез в групата във Viber" })).toHaveCount(0);

    const { data: payment } = await db
      .from("payments")
      .select("bank_reference, status, subscriptions!inner(user_id, plan_id)")
      .eq("subscriptions.user_id", member.id)
      .eq("subscriptions.plan_id", plan.id)
      .single();
    expect(payment?.status).toBe("pending");

    const adminPage = await (await browser.newContext()).newPage();
    await login(adminPage, admin, "/admin/plashtaniya");
    const row = adminPage.getByRole("row").filter({ hasText: payment!.bank_reference! });
    await expect(row.getByText(`Абонамент: ${plan.name}`)).toBeVisible();
    await row.getByRole("button", { name: "Потвърди превода" }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByRole("button", { name: "Потвърди", exact: true }).click();
    // The dialog closes when the action is done, and the payment leaves "Чакащи преводи". (While the dialog is
    // open the table is aria-hidden, so the row only counts as gone after the dialog has closed.)
    await expect(dialog).toBeHidden();
    await expect(row).toHaveCount(0);

    await page.goto("/profil/abonamenti");
    await expect(statusCard(page, plan.name).getByText("Активен")).toBeVisible();
    await expect(page.getByRole("link", { name: "Влез в групата във Viber" })).toHaveAttribute("href", inviteLink);

    // The member leaves her Viber number; the team sees it on the admin Viber page.
    const viber = statusCard(page, group.name);
    await expect(viber.getByLabel("Номер във Viber")).toHaveValue("+359 888 555 444");
    await viber.getByLabel("Име във Viber (по желание)").fill("Мария Т.");
    await viber.getByRole("button", { name: "Изпрати номера" }).click();
    await expect(page.getByText("Благодарим! Екипът ще те добави в групата.")).toBeVisible();

    const { data: access } = await db.from("viber_memberships").select("status, viber_display_name").eq("user_id", member.id).single();
    expect(access).toEqual({ status: "pending_invite", viber_display_name: "Мария Т." });

    await adminPage.goto("/admin/viber");
    const request = adminPage.getByRole("row").filter({ hasText: `${member.firstName} ${member.lastName}` });
    await expect(request.getByText("Viber: +359 888 555 444 · Мария Т.")).toBeVisible();
    await request.getByRole("button", { name: "Поканих я" }).click();
    await expect
      .poll(async () => (await db.from("viber_memberships").select("status").eq("user_id", member.id).single()).data?.status)
      .toBe("invited");
  });

  test("a second request for the same plan is refused", async ({ page }) => {
    const member = await createUser();
    const { plan } = await createPlanWithViberGroup();
    await login(page, member, "/profil/abonamenti");
    await planCard(page, plan.name).getByRole("button", { name: "Банков превод" }).click();
    await expect(page).toHaveURL(/\/profil\/abonamenti\?prevod=/);
    // The plan now says it is taken instead of offering the buttons again.
    await expect(page.getByText("Вече имаш това членство.")).toBeVisible();

    const { count } = await db.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", member.id);
    expect(count).toBe(1);
  });
});
