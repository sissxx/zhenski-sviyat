import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/email/reminders";

/**
 * Sends the reminder emails that are due. Called every hour by the database (pg_cron + pg_net) with
 * `Authorization: Bearer <CRON_SECRET>`; the same secret is stored in Supabase Vault (docs/emails.md).
 * Safe to call more often: each reminder is sent once.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Reminders: CRON_SECRET or SUPABASE_SECRET_KEY is missing.");
    return new Response("Not configured", { status: 503 });
  }
  if (!authorized(request, secret)) return new Response("Unauthorized", { status: 401 });

  try {
    return Response.json(await sendDueReminders());
  } catch (error) {
    console.error("Reminders: run failed", error);
    return new Response("Reminder run failed", { status: 500 });
  }
}
