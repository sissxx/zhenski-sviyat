import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured } from "./brevo";
import { sendConsultationReminder, sendEventReminder, sendSubscriptionRenewalReminder } from "./notifications";
import type { SendEmailResult } from "./send";

/**
 * The reminder run: asks the database what is due (due_reminders(), which skips anything already in email_log)
 * and sends each reminder once. The database calls /api/cron/reminders every hour (pg_cron + pg_net, see
 * supabase/migrations/20261023120000_reminders.sql); how early each reminder goes is set in Admin → Настройки.
 */

/** Brevo's free plan sends 300 emails a day; one run never uses more than a share of that. */
export const maxRemindersPerRun = 100;

type Kind = "consultation" | "event" | "subscription";

export type ReminderRunResult =
  | { status: "not_configured"; reason: string }
  | { status: "done"; due: number; results: Record<Kind, Partial<Record<SendEmailResult, number>>> };

const senders: Record<Kind, (id: string, dedupeKey: string) => Promise<SendEmailResult>> = {
  consultation: sendConsultationReminder,
  event: sendEventReminder,
  subscription: sendSubscriptionRenewalReminder,
};

export async function sendDueReminders(): Promise<ReminderRunResult> {
  // Without Brevo every send would be logged as skipped without its key and tried again each hour.
  if (!isEmailConfigured()) return { status: "not_configured", reason: "BREVO_API_KEY or EMAIL_FROM_ADDRESS not set" };
  const db = createAdminClient();
  const { data: due, error } = await db.rpc("due_reminders");
  if (error) throw new Error(`due_reminders failed: ${error.message}`);

  const results: Record<Kind, Partial<Record<SendEmailResult, number>>> = { consultation: {}, event: {}, subscription: {} };
  for (const row of (due ?? []).slice(0, maxRemindersPerRun)) {
    const kind = row.kind as Kind;
    const send = senders[kind];
    if (!send) continue;
    let result: SendEmailResult;
    try {
      result = await send(row.target_id, row.dedupe_key);
    } catch (sendError) {
      console.error(`reminder ${row.dedupe_key} failed`, sendError);
      result = "failed";
    }
    results[kind][result] = (results[kind][result] ?? 0) + 1;
  }
  return { status: "done", due: due?.length ?? 0, results };
}
