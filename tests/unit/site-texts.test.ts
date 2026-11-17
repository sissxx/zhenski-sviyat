import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { editableGroups, editableTexts } from "@/content/editable-texts";
import { blockText, lines } from "@/lib/content/texts";

describe("editable site texts", () => {
  it("has unique keys and lists every group's texts", () => {
    const keys = editableTexts.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBe(editableGroups.reduce((n, g) => n + g.texts.length, 0));
  });

  it("reads a saved value stored as a string or as { text }", () => {
    expect(blockText("Здравей")).toBe("Здравей");
    expect(blockText({ text: "Здравей" })).toBe("Здравей");
    expect(blockText({ other: 1 })).toBeNull();
    expect(blockText(null)).toBeNull();
  });

  it("splits one-per-line texts and skips blank lines", () => {
    expect(lines("Първа\r\n\n  Втора  \n")).toEqual(["Първа", "Втора"]);
  });

  it("keeps the current goals as the default for За нас", () => {
    expect(lines(editableTexts.find((t) => t.key === "about.goals")!.defaultValue).length).toBeGreaterThan(3);
  });
});
