import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/env", () => ({ supabaseUrl: () => "https://example.supabase.co" }));

import { initials, toPublicTeamMember } from "@/lib/team/types";

describe("toPublicTeamMember", () => {
  const row = { id: "1", full_name: "Иванка Иванова", role_title: "Адвокат", bio: "Кратко", photo_path: "team/a b.jpg", member_group: "founder" };

  it("maps a published row with its photo URL", () => {
    expect(toPublicTeamMember(row)).toEqual({
      id: "1",
      name: "Иванка Иванова",
      shortName: "Иванка Иванова",
      role: "Адвокат",
      shortRole: "Адвокат",
      bio: "Кратко",
      photoUrl: "https://example.supabase.co/storage/v1/object/public/media/team/a%20b.jpg",
      group: "founder",
    });
  });

  it("has no photo URL without a photo and puts unknown groups under team", () => {
    const member = toPublicTeamMember({ ...row, photo_path: null, member_group: "other" });
    expect(member.photoUrl).toBeNull();
    expect(member.group).toBe("team");
  });
});

describe("initials", () => {
  it("skips titles like адв.", () => {
    expect(initials("адв. Ирена Станчева Станчева")).toBe("ИС");
    expect(initials("Лили Гълъбова")).toBe("ЛГ");
  });
});
