import { mediaUrl } from "@/lib/supabase/media";

export const teamGroups = ["founder", "team", "ambassador"] as const;
export type TeamGroup = (typeof teamGroups)[number];

/** Section headings on /uchrediteli, in display order. */
export const teamGroupTitles: Record<TeamGroup, string> = {
  founder: "Учредители",
  team: "Екип",
  ambassador: "Посланици",
};

export type PublicTeamMember = {
  id: string;
  name: string;
  /** Shorter label for the homepage strip; same as `name` for people added in the admin panel. */
  shortName: string;
  role: string | null;
  shortRole: string | null;
  bio: string | null;
  photoUrl: string | null;
  group: TeamGroup;
};

type TeamMemberRow = {
  id: string;
  full_name: string;
  role_title: string | null;
  bio: string | null;
  photo_path: string | null;
  member_group: string;
};

export function toPublicTeamMember(row: TeamMemberRow): PublicTeamMember {
  const group = (teamGroups as readonly string[]).includes(row.member_group) ? (row.member_group as TeamGroup) : "team";
  return {
    id: row.id,
    name: row.full_name,
    shortName: row.full_name,
    role: row.role_title,
    shortRole: row.role_title,
    bio: row.bio,
    photoUrl: mediaUrl(row.photo_path),
    group,
  };
}

/** Initials for the round placeholder when someone has no photo yet, e.g. "адв. Ирена Станчева" → "ИС". */
export function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w && !w.endsWith("."));
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
