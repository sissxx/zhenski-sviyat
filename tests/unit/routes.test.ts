import { describe, expect, it } from "vitest";
import {
  consultationConfirmationPath,
  contactPath,
  eventConfirmationPath,
  eventPath,
  eventRegistrationPath,
  footerNav,
  loginPath,
  mainNav,
  routes,
  safeNextPath,
} from "@/lib/routes";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/profil/sabitiya")).toBe("/profil/sabitiya");
    expect(safeNextPath("/sabitiya/x?y=1")).toBe("/sabitiya/x?y=1");
  });

  it("rejects anything that could leave the site", () => {
    for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "evil", "", null, undefined]) {
      expect(safeNextPath(next)).toBe(routes.account);
    }
  });

  it("uses the given fallback", () => {
    expect(safeNextPath("//x", routes.home)).toBe("/");
  });
});

describe("path builders", () => {
  it("builds event paths", () => {
    expect(eventPath("joga")).toBe("/sabitiya/joga");
    expect(eventRegistrationPath("joga")).toBe("/sabitiya/joga/zapisvane");
    expect(eventConfirmationPath("joga")).toBe("/sabitiya/joga/potvarzhdenie");
  });

  it("encodes query values", () => {
    expect(contactPath("Пакет „Злато“ & още")).toBe(`/kontakti?tema=${encodeURIComponent("Пакет „Злато“ & още")}`);
    expect(loginPath("/profil?a=1&b=2")).toBe("/vhod?next=%2Fprofil%3Fa%3D1%26b%3D2");
    expect(loginPath()).toBe("/vhod");
    expect(consultationConfirmationPath("abc")).toBe("/konsultatsii/potvarzhdenie?zapis=abc");
  });
});

describe("navigation", () => {
  const known = new Set<string>(Object.values(routes));

  it("only links to known routes", () => {
    const hrefs = [...mainNav, ...footerNav.flatMap((g) => [g.title, ...g.links])].map((item) => item.href);
    for (const href of hrefs) expect(known, href).toContain(href);
  });

  it("uses Latin slugs", () => {
    for (const path of known) expect(path).toMatch(/^\/[a-z0-9/-]*$/);
  });
});
