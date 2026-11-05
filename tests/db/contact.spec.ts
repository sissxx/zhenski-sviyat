import { expect, test, type APIRequestContext } from "@playwright/test";
import { adminRoutes } from "../../src/lib/admin/routes";
import { fakeBrevoUrl } from "./env";
import { createUser, db, login, unique } from "./support";

type SentEmail = { subject: string; text: string; tags: string[]; replyTo: string | null };

async function contactEmailsTo(request: APIRequestContext, email: string): Promise<SentEmail[]> {
  const response = await request.get(`${fakeBrevoUrl}/emails?to=${encodeURIComponent(email)}`);
  return ((await response.json()) as SentEmail[]).filter((sent) => sent.tags.includes("contact_message"));
}

test.describe("contact form", () => {
  test("a visitor's message is saved, emailed to the admins and handled in the admin panel", async ({ page, request }) => {
    const admin = await createUser({ admin: true });
    const id = unique();
    const sender = `posetitel-${id}@example.org`;
    const subject = `Дарение ${id}`;

    await page.goto(`/kontakti?tema=${encodeURIComponent(subject)}`);
    await page.getByRole("textbox", { name: "Име", exact: true }).fill("Елена Петрова");
    await page.getByRole("textbox", { name: "Имейл" }).fill(sender);
    await page.getByLabel("Съобщение").fill("Искам да подкрепя инициативите ви. Как да даря?");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Изпрати съобщение" }).click();
    await expect(page.getByText("Съобщението е изпратено")).toBeVisible();

    const { data: saved } = await db.from("contact_messages").select("id, name, subject, handled_at").eq("email", sender).single();
    expect(saved).toMatchObject({ name: "Елена Петрова", subject, handled_at: null });

    // Every admin gets it, and a reply goes straight to the sender.
    await expect.poll(async () => (await contactEmailsTo(request, admin.email)).filter((e) => e.subject.includes(subject)).length).toBe(1);
    const [email] = (await contactEmailsTo(request, admin.email)).filter((e) => e.subject.includes(subject));
    expect(email.replyTo).toBe(sender);
    expect(email.text).toContain("Как да даря?");

    await login(page, admin, adminRoutes.messages);
    const row = page.getByRole("row").filter({ hasText: subject });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Отговорено" }).click();
    await expect(page.getByText("Отбелязано като отговорено.")).toBeVisible();
    await expect.poll(async () => (await db.from("contact_messages").select("handled_at").eq("id", saved!.id).single()).data?.handled_at).not.toBeNull();
  });

  test("a bot that fills in the hidden field is ignored", async ({ page }) => {
    const sender = `bot-${unique()}@example.org`;
    await page.goto("/kontakti");
    await page.getByRole("textbox", { name: "Име", exact: true }).fill("Бот Ботов");
    await page.getByRole("textbox", { name: "Имейл" }).fill(sender);
    await page.getByLabel("Тема").fill("Реклама");
    await page.getByLabel("Съобщение").fill("Купете нашите услуги сега, евтино!");
    await page.locator('input[name="website"]').fill("https://spam.example", { force: true });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Изпрати съобщение" }).click();
    await expect(page.getByText("Съобщението е изпратено")).toBeVisible();
    const { count } = await db.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", sender);
    expect(count).toBe(0);
  });
});
