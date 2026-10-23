import { expect, test } from "@playwright/test";
import { clientFor, createEvent, createUser, db, login, paidCheckoutSession, sendStripeEvent, unique, type TestUser } from "./support";

/**
 * Card payments in Stripe test mode, without calling Stripe: the payment is created the way the sign-up
 * action creates it, and the tests post signed webhook events like the ones Stripe sends.
 */

/** A paid event and a card sign-up for it, waiting for payment. */
async function cardRegistration(user: TestUser, priceCents = 3000) {
  const event = await createEvent({ price_cents: priceCents, capacity: 3 });
  const member = await clientFor(user);
  const { data, error } = await member.rpc("register_for_event", { p_event_id: event.id, p_payment_method: "stripe" });
  if (error) throw error;
  const { registration_id: registrationId, payment_id: paymentId } = data[0];
  if (!paymentId) throw new Error("register_for_event returned no payment for a paid event");
  return { event, registrationId, paymentId };
}

test.describe("Stripe webhook", () => {
  test("refuses requests without a valid signature", async ({ request }) => {
    const unsigned = await request.post("/api/stripe/webhook", { data: { type: "checkout.session.completed" } });
    expect(unsigned.status()).toBe(400);

    const forged = await request.post("/api/stripe/webhook", {
      data: JSON.stringify({ id: "evt_forged", type: "checkout.session.completed", data: { object: {} } }),
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=forged" },
    });
    expect(forged.status()).toBe(400);
  });

  test("a completed Checkout confirms the payment and the seat, once", async ({ page, request }) => {
    const user = await createUser();
    const { event, registrationId, paymentId } = await cardRegistration(user);

    await login(page, user, `/sabitiya/${event.slug}/potvarzhdenie?zapisvane=${registrationId}`);
    await expect(page.getByRole("heading", { name: "Плащането не е завършено" })).toBeVisible();

    const session = paidCheckoutSession(paymentId, 3000);
    const eventId = `evt_test_completed_${paymentId.slice(0, 8)}`;
    const response = await sendStripeEvent(request, "checkout.session.completed", session, eventId);
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ received: true });

    const { data: payment } = await db
      .from("payments")
      .select("status, amount_cents, paid_at, stripe_payment_intent_id, stripe_checkout_session_id")
      .eq("id", paymentId)
      .single();
    expect(payment).toMatchObject({
      status: "succeeded",
      amount_cents: 3000,
      stripe_payment_intent_id: session.payment_intent,
      stripe_checkout_session_id: session.id,
    });
    expect(payment?.paid_at).not.toBeNull();
    const { data: registration } = await db.from("event_registrations").select("status").eq("id", registrationId).single();
    expect(registration?.status).toBe("confirmed");
    const { data: stored } = await db.from("stripe_webhook_events").select("processed_at, attempts").eq("id", eventId).single();
    expect(stored?.processed_at).not.toBeNull();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Плащането е потвърдено" })).toBeVisible();

    // Stripe retries deliveries: the same event is acknowledged without being applied again.
    const repeat = await sendStripeEvent(request, "checkout.session.completed", session, eventId);
    expect(await repeat.json()).toEqual({ received: true, duplicate: true });
    const { data: after } = await db.from("stripe_webhook_events").select("attempts").eq("id", eventId).single();
    expect(after?.attempts).toBe(stored?.attempts);
  });

  test("an expired Checkout releases the seat", async ({ request }) => {
    const user = await createUser();
    const { event, registrationId, paymentId } = await cardRegistration(user);
    const sessionId = `cs_test_${unique()}`;
    await db.from("payments").update({ stripe_checkout_session_id: sessionId }).eq("id", paymentId).throwOnError();

    const before = await db.from("event_listing").select("seats_left").eq("id", event.id).single();
    expect(before.data?.seats_left).toBe(2);

    const response = await sendStripeEvent(request, "checkout.session.expired", {
      id: sessionId,
      object: "checkout.session",
      mode: "payment",
      status: "expired",
      payment_status: "unpaid",
      client_reference_id: paymentId,
      metadata: { payment_id: paymentId },
    });
    expect(response.status()).toBe(200);

    const { data: payment } = await db.from("payments").select("status, failure_reason").eq("id", paymentId).single();
    expect(payment).toEqual({ status: "expired", failure_reason: "checkout_expired" });
    const { data: registration } = await db.from("event_registrations").select("status").eq("id", registrationId).single();
    expect(registration?.status).toBe("expired");
    const after = await db.from("event_listing").select("seats_left").eq("id", event.id).single();
    expect(after.data?.seats_left).toBe(3);
  });

  test("an old session expiring doesn't touch a payment that moved on to a new session", async ({ request }) => {
    const user = await createUser();
    const { paymentId } = await cardRegistration(user);
    // Session ids are unique across payments, so each test makes its own.
    await db.from("payments").update({ stripe_checkout_session_id: `cs_test_newer_${unique()}` }).eq("id", paymentId).throwOnError();

    await sendStripeEvent(request, "checkout.session.expired", {
      id: `cs_test_older_${unique()}`,
      object: "checkout.session",
      mode: "payment",
      status: "expired",
      client_reference_id: paymentId,
    });
    const { data: payment } = await db.from("payments").select("status").eq("id", paymentId).single();
    expect(payment?.status).toBe("pending");
  });

  test("a refund made in Stripe is recorded on the payment", async ({ request }) => {
    const user = await createUser();
    const { paymentId } = await cardRegistration(user, 4000);
    const session = paidCheckoutSession(paymentId, 4000);
    await sendStripeEvent(request, "checkout.session.completed", session);

    const response = await sendStripeEvent(request, "charge.refunded", {
      id: `ch_test_${unique()}`,
      object: "charge",
      payment_intent: session.payment_intent,
      amount: 4000,
      amount_refunded: 1500,
    });
    expect(response.status()).toBe(200);
    const { data: payment } = await db.from("payments").select("status, refunded_amount_cents").eq("id", paymentId).single();
    expect(payment).toEqual({ status: "partially_refunded", refunded_amount_cents: 1500 });
  });

  test("a member can't mark her own card payment as paid", async () => {
    // Members have no write access to payments: only the webhook (service key) confirms them.
    const user = await createUser();
    const { paymentId } = await cardRegistration(user);
    const member = await clientFor(user);
    await member.from("payments").update({ status: "succeeded" }).eq("id", paymentId);
    const { error } = await member.rpc("mark_payment_succeeded", { p_payment_id: paymentId, p_amount_cents: 3000 });
    expect(error).not.toBeNull();

    const { data: payment } = await db.from("payments").select("status").eq("id", paymentId).single();
    expect(payment?.status).toBe("pending");
  });
});
