"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { routes, safeNextPath } from "@/lib/routes";
import { authErrorMessage, genericAuthError, notConfiguredError } from "./errors";
import {
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  profileSchema,
  registerSchema,
  type ForgotPasswordValues,
  type LoginValues,
  type NewPasswordValues,
  type ProfileValues,
  type RegisterValues,
} from "./schemas";

/**
 * Server actions behind the account forms. Each one validates its input again with the form's schema,
 * since anything can be posted to an action. Errors come back as Bulgarian messages for the form to show.
 */

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; code?: string };

const invalidInput = { ok: false, error: "Моля, провери въведените данни." } as const;

/** The site's own origin for links in emails. NEXT_PUBLIC_SITE_URL wins; otherwise the request's host. */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Where email links land: /auth/confirm, which signs the user in and continues to `next`. */
async function emailLink(next: string): Promise<string> {
  return `${await siteOrigin()}${routes.authConfirm}?next=${encodeURIComponent(next)}`;
}

export async function signUp(values: RegisterValues): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const { firstName, lastName, phone, email, password, marketingConsent } = parsed.data;
  const next = safeNextPath(parsed.data.next);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await emailLink(next),
      // Read by the handle_new_auth_user trigger, which creates the profile.
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        terms_accepted: true,
        privacy_accepted: true,
        marketing_consent: marketingConsent,
      },
    },
  });
  if (error) return { ok: false, error: authErrorMessage(error), code: error.code };

  // With email confirmation off, Supabase signs the user in straight away.
  if (data.session) redirect(next);
  // With it on, an existing email also lands here (Supabase hides whether it is taken), and gets no new email.
  return { ok: true, data: { needsConfirmation: true } };
}

export async function signIn(values: LoginValues): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: authErrorMessage(error), code: error.code };

  redirect(safeNextPath(parsed.data.next));
}

export async function resendConfirmation(values: ForgotPasswordValues, next?: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: await emailLink(safeNextPath(next)) },
  });
  if (error) return { ok: false, error: authErrorMessage(error), code: error.code };
  return { ok: true };
}

export async function requestPasswordReset(values: ForgotPasswordValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await emailLink(routes.newPassword),
  });
  // Only rate limits are worth telling the user. Anything else would hint whether the email has an account.
  if (error?.code?.startsWith("over_")) return { ok: false, error: authErrorMessage(error), code: error.code };
  return { ok: true };
}

export async function updatePassword(values: NewPasswordValues): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { ok: false, error: "Линкът за смяна на паролата е изтекъл. Поискай нов.", code: "session_not_found" };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: authErrorMessage(error), code: error.code };

  redirect(`${routes.account}?parola=promenena`);
}

export async function updateProfile(values: ProfileValues): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return invalidInput;
  if (!isSupabaseConfigured()) return { ok: false, error: notConfiguredError };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: authErrorMessage({ code: "session_not_found" }) };

  const { firstName, lastName, phone, marketingConsent } = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName, phone: phone || null, marketing_consent: marketingConsent })
    .eq("id", userData.user.id);
  if (error) return { ok: false, error: error.code === "P0001" ? authErrorMessage({ message: error.message }) : genericAuthError };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(routes.home);
}
