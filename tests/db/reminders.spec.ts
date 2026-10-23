import { expect, test, type APIRequestContext } from "@playwright/test";
import { cronSecret, fakeBrevoUrl } from "./env";
import { clientFor, createConsultationService, createEvent, createPlanWithViberGroup, createUser, db } from "./support";

/**
 * Reminder emails: the hourly run (/api/cron/reminders) sends what due_reminders() finds, once each.
 * Emails land in the local stand-in for Brevo. Other tests may run reminders at the same time, so every check
 * looks only at this test's own user.
 */

const hours = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();
const days = (n: number) => hours(24 * n);

const runReminders = (request: APIRequestContext) =>
  request.post("/api/cron/reminders", { headers: { authorization: `Bearer ${cronSecret}` } });

type SentEmail = { subject: string; text: string; tags: string[] };

async function emailsTo(request: APIRequestContext, email: string, tag: string): Promise<SentEmail[]> {
  const response = await request.get(`${fakeBrevoUrl}/emails?to=${encodeURIComponent(email)}`);
  return ((await response.json()) as SentEmail[]).filter((sent) => sent.tags.includes(tag));
}

test.describe("reminder emails", () => {
  test("the reminder run needs the cron secret", async ({ request }) => {
    expect((await request.post("/api/cron/reminders")).status()).toBe(401);
    expect((await request.post("/api/cron/reminders", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
    const response = await runReminders(request);
    expect(response.status()).toBe(200);
    expect((await response.json()).status).toBe("done");
  });

  test("a consultation tomorrow gets one reminder; one booked inside the window gets none", async ({ request }) => {
    const [client, lateClient] = await Promise.all([createUser(), createUser()]);
    const { service, specialist } = await createConsultationService();
    const booking = (user: { id: string }, startsInHours: number, confirmedAt: string) => ({
      user_id: user.id,
      specialist_id: specialist.id,
      consultation_type_id: service.id,
      starts_at: hours(startsInHours),
      ends_at: hours(startsInHours + 1),
      blocked_until: hours(startsInHours + 1),
      status: "confirmed" as const,
      price_cents: 0,
      confirmed_at: confirmedAt,
    });
    const { error } = await db
      .from("consultation_bookings")
      .insert([booking(client, 20, days(-3)), booking(lateClient, 22, hours(-1))]);
    expect(error).toBeNull();

    expect((await runReminders(request)).status()).toBe(200);
    expect((await runReminders(request)).status()).toBe(200);

    const sent = await emailsTo(request, client.email, "consultation_reminder");
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toMatch(/^Напомняне: консултацията ти е (днес|утре) в \d\d:\d\d$/);
    expect(sent[0].text).toContain(service.name);
    expect(sent[0].text).toContain(specialist.full_name);
    expect(await emailsTo(request, lateClient.email, "consultation_reminder")).toHaveLength(0);
  });

  test("an online event reminder carries the joining link", async ({ request }) => {
    const [member, cancelled] = await Promise.all([createUser(), createUser()]);
    const event = await createEvent({ format: "online", starts_at: hours(10), ends_at: hours(12) });
    await db.from("event_private_details").insert({ event_id: event.id, online_url: "https://meet.example.org/napomnyane" });
    const { error } = await db.from("event_registrations").insert([
      { event_id: event.id, user_id: member.id, status: "confirmed", price_cents: 0, confirmed_at: days(-2) },
      { event_id: event.id, user_id: cancelled.id, status: "cancelled", price_cents: 0, cancelled_at: days(-1) },
    ]);
    expect(error).toBeNull();

    await runReminders(request);
    await runReminders(request);

    const sent = await emailsTo(request, member.email, "event_reminder");
    expect(sent).toHaveLength(1);
    expect(sent[0].subject).toContain(`Напомняне: „${event.title}“`);
    expect(sent[0].text).toContain("https://meet.example.org/napomnyane");
    expect(await emailsTo(request, cancelled.email, "event_reminder")).toHaveLength(0);
  });

  test("a bank-transfer membership ending in 3 days gets a renewal reminder, with transfer details once renewal started", async ({
    request,
  }) => {
    const [member, renewing, cardMember] = await Promise.all([createUser(), createUser(), createUser()]);
    const { plan } = await createPlanWithViberGroup({ priceCents: 800 });
    const active = (user: { id: string }, provider: "bank_transfer" | "stripe" = "bank_transfer") => ({
      user_id: user.id,
      plan_id: plan.id,
      provider,
      status: "active" as const,
      current_period_start: days(-27),
      current_period_end: days(3),
      ...(provider === "stripe" ? { stripe_subscription_id: `sub_test_${user.id.slice(0, 8)}` } : {}),
    });
    const { error } = await db.from("subscriptions").insert([active(member), active(renewing), active(cardMember, "stripe")]);
    expect(error).toBeNull();
    const { data: renewal, error: renewalError } = await (await clientFor(renewing))
      .rpc("start_bank_transfer_subscription", { p_plan_id: plan.id })
      .single();
    expect(renewalError).toBeNull();

    await runReminders(request);
    await runReminders(request);

    const [toMember] = await emailsTo(request, member.email, "subscription_renewal_reminder");
    expect(toMember.subject.startsWith(`Напомняне: членството „${plan.name}“ изтича на `)).toBe(true);
    expect(toMember.text).toContain("Поднови с превод");
    expect(await emailsTo(request, member.email, "subscription_renewal_reminder")).toHaveLength(1);

    const [toRenewing] = await emailsTo(request, renewing.email, "subscription_renewal_reminder");
    expect(toRenewing.text).toContain("Очакваме превода ти");
    expect(toRenewing.text).toContain(renewal!.bank_reference!);

    // Card members renew automatically through Stripe.
    expect(await emailsTo(request, cardMember.email, "subscription_renewal_reminder")).toHaveLength(0);
  });
});
