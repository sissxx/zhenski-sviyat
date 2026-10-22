import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * The specialist profile linked to the signed-in account (`specialists.user_id`, set by the admin), or null.
 * Cached per request, so the account layout and the page share one lookup.
 */
export const getMySpecialist = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("specialists")
    .select("id, slug, full_name, title, is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
});

/** Guard for the specialist's own pages: anyone without a linked specialist profile gets the 404 page. */
export async function requireSpecialistPage() {
  const specialist = await getMySpecialist();
  if (!specialist) notFound();
  return { specialist, supabase: await createClient() };
}
