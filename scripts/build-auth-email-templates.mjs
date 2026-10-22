// Writes the Bulgarian Supabase Auth email templates (supabase/templates/*.html) from the same layout as the
// site's own emails. Run after changing src/lib/email/layout.ts or the texts below:
//
//   npm run email:auth-templates
//
// Then paste each file into Supabase → Authentication → Emails → Templates (see docs/emails.md).

import { mkdirSync, writeFileSync } from "node:fs";
import { renderEmail } from "../src/lib/email/layout.ts";

const siteName = "Сдружение Женски свят";
const link = (type) => `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=${type}&next={{ .RedirectTo }}`;
const ignore = "Ако не очакваш този имейл, просто го игнорирай.";

const templates = {
  confirmation: {
    subject: "Потвърди имейла си",
    preheader: `Остава една стъпка до профила ти в ${siteName}.`,
    heading: "Потвърди имейла си",
    blocks: [
      { kind: "text", text: `Благодарим ти, че се регистрира в сайта на ${siteName}. Потвърди имейла си, за да влезеш в профила си.` },
      { kind: "button", label: "Потвърди имейла", url: link("email") },
      { kind: "note", text: `Бутонът не работи? Копирай този адрес в браузъра:\n${link("email")}` },
      { kind: "note", text: ignore },
    ],
  },
  recovery: {
    subject: "Нова парола",
    preheader: "Линк за избор на нова парола.",
    heading: "Смяна на паролата",
    blocks: [
      { kind: "text", text: "Получихме заявка за нова парола за профила ти. Натисни бутона, за да избереш нова парола." },
      { kind: "button", label: "Избери нова парола", url: link("recovery") },
      { kind: "note", text: `Бутонът не работи? Копирай този адрес в браузъра:\n${link("recovery")}` },
      { kind: "note", text: `${ignore} Паролата ти няма да се промени.` },
    ],
  },
  email_change: {
    subject: "Потвърди новия си имейл",
    preheader: "Потвърди смяната на имейла в профила си.",
    heading: "Смяна на имейла",
    blocks: [
      { kind: "text", text: "Поиска да смениш имейла на профила си от {{ .Email }} на {{ .NewEmail }}. Потвърди смяната с бутона по-долу." },
      { kind: "button", label: "Потвърди новия имейл", url: link("email_change") },
      { kind: "note", text: `Бутонът не работи? Копирай този адрес в браузъра:\n${link("email_change")}` },
      { kind: "note", text: `${ignore} Имейлът ти няма да се промени.` },
    ],
  },
};

const outDir = new URL("../supabase/templates/", import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const [name, content] of Object.entries(templates)) {
  const { html } = renderEmail(content, {
    siteName,
    siteUrl: "{{ .SiteURL }}",
    footerNote: `Получаваш този имейл, защото адресът ти е въведен в сайта на ${siteName}.`,
  });
  writeFileSync(new URL(`${name}.html`, outDir), html);
  console.log(`supabase/templates/${name}.html  (subject: ${content.subject})`);
}
