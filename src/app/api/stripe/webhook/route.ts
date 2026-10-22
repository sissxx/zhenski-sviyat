import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, webhookSecret } from "@/lib/stripe/server";
import { handleStripeEvent } from "@/lib/stripe/webhook";

/**
 * Stripe webhook (spec 10.2). Checks the signature, stores each event once in stripe_webhook_events,
 * then applies it. A 500 makes Stripe retry, so only answer 200 once the event is recorded and processed.
 * An event that was already processed is acknowledged without doing anything again.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const secret = webhookSecret();
  if (!secret || !process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Stripe webhook: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET or SUPABASE_SECRET_KEY is missing.");
    return new Response("Not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature covers the exact bytes Stripe sent, so read the raw body.
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const db = createAdminClient();
  const { error: insertError } = await db
    .from("stripe_webhook_events")
    .upsert({ id: event.id, type: event.type, payload: JSON.parse(body) }, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) {
    console.error("Stripe webhook: could not store event", event.id, insertError);
    return new Response("Storage error", { status: 500 });
  }

  const { data: stored } = await db.from("stripe_webhook_events").select("processed_at, attempts").eq("id", event.id).single();
  if (stored?.processed_at) return Response.json({ received: true, duplicate: true });

  try {
    await handleStripeEvent(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Stripe webhook: processing failed", event.id, event.type, message);
    await db
      .from("stripe_webhook_events")
      .update({ attempts: (stored?.attempts ?? 0) + 1, last_error: message.slice(0, 1000) })
      .eq("id", event.id);
    return new Response("Processing error", { status: 500 });
  }

  await db
    .from("stripe_webhook_events")
    .update({ processed_at: new Date().toISOString(), attempts: (stored?.attempts ?? 0) + 1, last_error: null })
    .eq("id", event.id);
  return Response.json({ received: true });
}
