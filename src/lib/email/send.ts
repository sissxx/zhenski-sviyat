import "server-only";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured, sendViaBrevo, type Recipient } from "./brevo";
import { renderEmail, type EmailContent } from "./layout";

/**
 * Sends one transactional email and records it in email_log. This is the helper every flow uses (events,
 * consultations, payments, and the Stripe webhook later):
 *
 *   await sendEmail({ template: "payment_confirmed", to, content, userId, dedupeKey: `payment_confirmed:${id}` });
 *
 * - dedupeKey makes a send idempotent: a second call with the same key is skipped (email_log.dedupe_key is unique).
 *   A failed send clears its key so the next attempt can try again.
 * - Without BREVO_API_KEY / EMAIL_FROM_ADDRESS nothing is sent and the row is logged as "skipped".
 * - It never throws: a missing email must not undo a booking or a payment. The result says what happened.
 */

export type SendEmailInput = {
  /** Short key stored in email_log and sent to Brevo as a tag, e.g. "event_registration_confirmed". */
  template: string;
  to: Recipient;
  content: EmailContent;
  userId?: string | null;
  dedupeKey?: string;
  related?: { table: string; id: string };
};

export type SendEmailResult = "sent" | "skipped" | "duplicate" | "failed";

/** Public address of the site for links in emails. */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) return (configured.startsWith("http") ? configured : `https://${configured}`).replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const absoluteUrl = (path: string) => `${siteUrl()}${path}`;

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const rendered = renderEmail(input.content, {
    siteName: site.name,
    siteUrl: siteUrl(),
    footerNote: `Получаваш този имейл, защото имаш профил в сайта на ${site.name}.`,
  });

  let supabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    supabase = createAdminClient();
  } catch {
    // No SUPABASE_SECRET_KEY: still send, just without the log and the duplicate check.
  }

  const configured = isEmailConfigured();
  let logId: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("email_log")
      .insert({
        to_email: input.to.email,
        template_key: input.template,
        user_id: input.userId ?? null,
        // A skipped send keeps no key, so the same email can still go out once Brevo is set up.
        dedupe_key: configured ? (input.dedupeKey ?? null) : null,
        status: configured ? "queued" : "skipped",
        related_table: input.related?.table ?? null,
        related_id: input.related?.id ?? null,
        error: configured ? null : "BREVO_API_KEY or EMAIL_FROM_ADDRESS not set",
      })
      .select("id")
      .single();
    if (error?.code === "23505") return "duplicate";
    if (error) console.error("email_log insert failed", error.message);
    logId = data?.id ?? null;
  }

  if (!configured) {
    console.warn(`email "${input.template}" not sent: BREVO_API_KEY or EMAIL_FROM_ADDRESS not set`);
    return "skipped";
  }

  try {
    const { messageId } = await sendViaBrevo(input.to, rendered, input.template);
    if (supabase && logId) {
      await supabase
        .from("email_log")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: messageId })
        .eq("id", logId);
    }
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`email "${input.template}" failed`, message);
    if (supabase && logId) {
      await supabase.from("email_log").update({ status: "failed", error: message.slice(0, 500), dedupe_key: null }).eq("id", logId);
    }
    return "failed";
  }
}
