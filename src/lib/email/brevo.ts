import "server-only";
import { site } from "@/lib/site";
import type { RenderedEmail } from "./layout";

/**
 * Brevo transactional email API (https://developers.brevo.com/reference/sendtransacemail).
 * The key lives only in BREVO_API_KEY on the server; the sender address must be a verified Brevo sender.
 */

// BREVO_API_URL only exists for the database tests, which point it at a local stand-in (tests/db/fake-brevo.ts).
const endpoint = () => process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email";

export type Recipient = { email: string; name?: string | null };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}

export async function sendViaBrevo(to: Recipient, email: RenderedEmail, tag: string): Promise<{ messageId: string | null }> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) throw new Error("BREVO_API_KEY or EMAIL_FROM_ADDRESS is not set");

  const replyTo = process.env.EMAIL_REPLY_TO;
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: fromAddress, name: process.env.EMAIL_FROM_NAME || site.name },
      to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
      tags: [tag],
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Brevo ${response.status}: ${body.slice(0, 300)}`);
  }
  const data = (await response.json().catch(() => ({}))) as { messageId?: string };
  return { messageId: data.messageId ?? null };
}
