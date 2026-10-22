import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loginPath, routes } from "@/lib/routes";

/**
 * Whether the signed-in user is an active admin, asked of the database (`is_admin()` reads `user_roles`
 * and the profile status). Cached per request.
 */
const checkAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, isAdmin: false } as const;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return { user, isAdmin: !error && data === true } as const;
});

/** For showing a link to the admin area (e.g. in the account area). Not a security check. */
export async function isCurrentUserAdmin() {
  return (await checkAdmin()).isAdmin;
}

/**
 * Guard for admin pages. Visitors go to login; signed-in users who aren't admins get the 404 page,
 * so the admin area doesn't announce itself. RLS still checks every query and write on its own.
 */
export async function requireAdminPage(next: string = routes.admin) {
  const { user, isAdmin } = await checkAdmin();
  if (!user) redirect(loginPath(next));
  if (!isAdmin) notFound();
  return { user, supabase: await createClient() };
}

export class AdminAccessError extends Error {}

/** Guard for admin server actions and route handlers: the signed-in admin's client, or an error. */
export async function requireAdminAction() {
  const { user, isAdmin } = await checkAdmin();
  if (!user || !isAdmin) throw new AdminAccessError("forbidden");
  return { user, supabase: await createClient() };
}
