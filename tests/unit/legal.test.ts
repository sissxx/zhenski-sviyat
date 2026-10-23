import { describe, expect, it } from "vitest";
import { cookieSections } from "@/content/legal/cookies";
import { privacySections } from "@/content/legal/privacy";
import { termsSections } from "@/content/legal/terms";
import { legalUpdatedAt } from "@/lib/legal";

describe("legal pages", () => {
  it.each([
    ["privacy", privacySections],
    ["terms", termsSections],
    ["cookies", cookieSections],
  ])("%s has unique anchors and no empty sections", (_name, sections) => {
    const ids = sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of sections) expect(section.blocks.length).toBeGreaterThan(0);
  });

  it("has a valid date in force", () => {
    expect(legalUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(new Date(legalUpdatedAt).getTime())).toBe(false);
  });
});
