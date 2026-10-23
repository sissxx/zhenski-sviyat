import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import type { Database } from "../../src/lib/supabase/database.types";
import { publishableKey, secretKey, stripeWebhookSecret, supabaseTestUrl } from "./env";

/**
 * Helpers for the database tests. Each test makes its own users, events, services and plans with unique
 * names, so tests run in parallel and in any order against the same local database.
 */

/** Service-role client for setting up data and checking what the pages wrote. Bypasses RLS. */
export const db = createClient<Database>(supabaseTestUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const password = "Test-parola-123";

/** Short unique suffix for slugs and emails. */
export const unique = () => randomUUID().slice(0, 8);

export type TestUser = { id: string; email: string; firstName: string; lastName: string };

/** A confirmed account, created the way Supabase Auth does it; the profile comes from the auth trigger. */
export async function createUser({ admin = false, phone }: { admin?: boolean; phone?: string } = {}): Promise<TestUser> {
  const id = unique();
  const user = { email: `test-${id}@example.org`, firstName: admin ? "Админ" : "Мария", lastName: `Тест ${id}` };
  const { data, error } = await db.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
    user_metadata: { first_name: user.firstName, last_name: user.lastName, phone, terms_accepted: true, privacy_accepted: true },
  });
  if (error) throw error;
  if (admin) {
    const { error: roleError } = await db.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
    if (roleError) throw roleError;
  }
  return { id: data.user.id, ...user };
}

/** Logs in through the login page and waits until the redirect to `next` (default: the account page). */
export async function login(page: Page, user: TestUser, next?: string) {
  await page.goto(next ? `/vhod?next=${encodeURIComponent(next)}` : "/vhod");
  await page.getByRole("textbox", { name: "Имейл" }).fill(user.email);
  await page.getByLabel("Парола", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Вход", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === (next ? new URL(next, url).pathname : "/profil"));
}

/** A signed-in Supabase client for one user, to call the database functions as that user (RLS applies). */
export async function clientFor(user: TestUser) {
  const client = createClient<Database>(supabaseTestUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email: user.email, password });
  if (error) throw error;
  return client;
}

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];

/** A published event ten days from now, unless `overrides` say otherwise. */
export async function createEvent(overrides: Partial<EventInsert> = {}) {
  const id = unique();
  const startsAt = new Date(Date.now() + 10 * 86_400_000);
  startsAt.setUTCHours(15, 0, 0, 0);
  const { data, error } = await db
    .from("events")
    .insert({
      slug: `test-sabitie-${id}`,
      title: `Тестово събитие ${id}`,
      summary: "Кратко описание за теста.",
      description: "Описание на тестовото събитие.",
      status: "published",
      format: "in_person",
      city: "София",
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + 2 * 3_600_000).toISOString(),
      price_cents: 0,
      capacity: 20,
      published_at: new Date().toISOString(),
      ...overrides,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * A consultation service with its own specialist who works every day 09:00-17:00 (Sofia time),
 * so no other test takes its slots.
 */
export async function createConsultationService({
  priceCents = 0,
  requiresPrepayment = false,
  allowBankTransfer = false,
}: { priceCents?: number; requiresPrepayment?: boolean; allowBankTransfer?: boolean } = {}) {
  const id = unique();
  const { data: specialist, error: specialistError } = await db
    .from("specialists")
    .insert({ slug: `test-spetsialist-${id}`, full_name: `Специалист ${id}`, title: "Психолог" })
    .select()
    .single();
  if (specialistError) throw specialistError;
  const { data: service, error: serviceError } = await db
    .from("consultation_types")
    .insert({
      slug: `test-usluga-${id}`,
      name: `Тестова консултация ${id}`,
      duration_minutes: 60,
      price_cents: priceCents,
      requires_prepayment: requiresPrepayment,
      allow_bank_transfer: allowBankTransfer,
    })
    .select()
    .single();
  if (serviceError) throw serviceError;
  const links = await Promise.all([
    db.from("specialist_consultation_types").insert({ specialist_id: specialist.id, consultation_type_id: service.id }),
    db.from("specialist_availability").insert(
      [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ specialist_id: specialist.id, weekday, start_time: "09:00", end_time: "17:00" })),
    ),
  ]);
  for (const { error } of links) if (error) throw error;
  return { service, specialist };
}

/** A monthly plan that opens one Viber group with an invite link. */
export async function createPlanWithViberGroup({ priceCents = 800 }: { priceCents?: number } = {}) {
  const id = unique();
  const { data: plan, error: planError } = await db
    .from("membership_plans")
    .insert({ slug: `test-plan-${id}`, name: `Тестово членство ${id}`, price_cents: priceCents, features: ["Среща всеки месец"] })
    .select()
    .single();
  if (planError) throw planError;
  const { data: group, error: groupError } = await db
    .from("viber_groups")
    .insert({ slug: `test-grupa-${id}`, name: `Тестова Viber група ${id}` })
    .select()
    .single();
  if (groupError) throw groupError;
  const inviteLink = `https://invite.viber.com/?g2=test-${id}`;
  const links = await Promise.all([
    db.from("plan_viber_groups").insert({ plan_id: plan.id, viber_group_id: group.id }),
    db.from("viber_group_invites").insert({ viber_group_id: group.id, invite_link: inviteLink }),
  ]);
  for (const { error } of links) if (error) throw error;
  return { plan, group, inviteLink };
}

const stripe = new Stripe("sk_test_local_database_tests");

/** Posts a Stripe event to the webhook, signed with the test secret the server was started with. */
export async function sendStripeEvent(request: APIRequestContext, type: string, object: Record<string, unknown>, id = `evt_test_${unique()}`) {
  const payload = JSON.stringify({
    id,
    object: "event",
    api_version: "2025-01-27.acacia",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: { object },
  });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: stripeWebhookSecret });
  return request.post("/api/stripe/webhook", {
    data: payload,
    headers: { "content-type": "application/json", "stripe-signature": signature },
  });
}

/** A completed, paid one-time Checkout Session for a payment, as Stripe sends it. */
export function paidCheckoutSession(paymentId: string, amountCents: number) {
  const id = unique();
  return {
    id: `cs_test_${id}`,
    object: "checkout.session",
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    client_reference_id: paymentId,
    metadata: { payment_id: paymentId },
    amount_total: amountCents,
    currency: "eur",
    payment_intent: `pi_test_${id}`,
  };
}
