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
      bookingHref: null,
    });
  });

  it("fills empty fields from the linked specialist and links to booking", () => {
    const member = toPublicTeamMember({
      ...row,
      role_title: null,
      bio: "",
      photo_path: null,
      specialist: { slug: "irena", title: "Адвокат и медиатор", bio: "От профила", photo_path: "specialists/i.jpg", is_active: true },
    });
    expect(member.role).toBe("Адвокат и медиатор");
    expect(member.bio).toBe("От профила");
    expect(member.photoUrl).toContain("specialists/i.jpg");
    expect(member.bookingHref).toBe("/konsultatsii?spetsialist=irena#booking-title");
    expect(toPublicTeamMember({ ...row, specialist: { slug: "x", title: null, bio: null, photo_path: null, is_active: false } }).bookingHref).toBeNull();
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
