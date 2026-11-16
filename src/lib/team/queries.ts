import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { founders as draftFounders } from "@/content/founders";
import { toPublicTeamMember, type PublicTeamMember } from "./types";

/**
 * Published people from „Учредители и екип“ in the admin panel, in the admin's sort order.
 * RLS shows visitors only published rows. Until anyone is published (or Supabase isn't set up),
 * the draft founders list from Figma is shown so the pages are never empty.
 */
export const listTeamMembers = cache(async (): Promise<PublicTeamMember[]> => {
  // Admins edit this list at any time, so the pages render per request.
  await connection();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const columns = "id, slug, full_name, role_title, bio, photo_path, member_group, sort_order";
    const query = (select: string) =>
      supabase.from("team_members").select(select).eq("is_published", true).order("sort_order", { ascending: true }).order("full_name", { ascending: true });
    let { data, error } = await query(`${columns}, specialist:specialists(slug, title, bio, photo_path, is_active)`);
    // Until the team_members.specialist_id migration is applied, read the list without the linked specialist.
    if (error) ({ data, error } = await query(columns));
    if (error) console.error("listTeamMembers", error);
    else if (data && data.length > 0) return (data as unknown as Parameters<typeof toPublicTeamMember>[0][]).map(toPublicTeamMember);
  }
  return draftFounders.map((f, i) => ({
    id: `draft-${i}`,
    name: f.name,
    shortName: f.shortName,
    role: f.role,
    shortRole: f.shortRole,
    bio: null,
    photoUrl: null,
    group: "founder" as const,
  }));
});
