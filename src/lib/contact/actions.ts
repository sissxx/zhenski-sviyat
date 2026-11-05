"use server";

import { notifyContactMessage, notifyLater } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { contactSchema, type ContactValues } from "./schema";

export type ContactResult = { ok: true } | { ok: false; error: string };

/** How many messages one email address may send in the window below, against floods. */
const maxPerWindow = 3;
const windowMinutes = 10;

/**
 * Saves a contact-form message in contact_messages and emails the admins. Visitors can't write that table
 * (RLS), so the insert uses the service key after validating the input here.
 */
export async function sendContactMessage(values: ContactValues): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Моля, провери въведените данни." };
  // A bot filled in the hidden field: pretend it worked.
  if (parsed.data.website) return { ok: true };

  let db: ReturnType<typeof createAdminClient>;
  try {
    db = createAdminClient();
  } catch {
    return { ok: false, error: "Формата за контакт временно не работи. Моля, опитай отново по-късно." };
  }

  const { name, email, subject, message } = parsed.data;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count } = await db
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);
  if ((count ?? 0) >= maxPerWindow) {
    return { ok: false, error: "Вече получихме няколко съобщения от този имейл. Моля, опитай отново след малко." };
  }

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  }

  const { data, error } = await db
    .from("contact_messages")
    .insert({ user_id: userId, name, email, subject, message, privacy_accepted: true })
    .select("id")
    .single();
  if (error || !data) {
    console.error("contact message insert failed", error?.message);
    return { ok: false, error: "Съобщението не беше изпратено. Моля, опитай отново." };
  }

  notifyLater(() => notifyContactMessage(data.id));
  return { ok: true };
}
