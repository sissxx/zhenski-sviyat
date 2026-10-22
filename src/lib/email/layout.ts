/**
 * One HTML layout for every email the site sends, plus a plain-text version. Table-based with inline styles so it
 * renders in Gmail, Outlook and phone mail apps; a single column up to 600px that shrinks on small screens.
 *
 * Keep this file free of "@/" imports: scripts/build-auth-email-templates.ts runs it with plain Node to write the
 * Supabase Auth templates in supabase/templates/.
 */

const colors = {
  primary: "#00552F",
  text: "#1F2E26",
  muted: "#5C6B5E",
  bg: "#FBF9F0",
  paper: "#FFFFFF",
  mint: "#EDF2E5",
  divider: "#DBE3D4",
} as const;

const fontStack = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const headingFont = "Lora, Georgia, 'Times New Roman', serif";

export type EmailBlock =
  | { kind: "text"; text: string }
  /** Label / value rows, e.g. date, place, amount. Rows with an empty value are left out. */
  | { kind: "details"; title?: string; rows: { label: string; value: string | null | undefined; mono?: boolean }[] }
  | { kind: "button"; label: string; url: string }
  /** Small grey text, e.g. "if you didn't ask for this…". */
  | { kind: "note"; text: string }
  /** Pale green box for something the reader must not miss. */
  | { kind: "callout"; text: string };

export type EmailContent = {
  subject: string;
  /** Short line mail apps show after the subject. */
  preheader: string;
  heading: string;
  /** "Здравей, Мария," — left out when the name is unknown. */
  greeting?: string;
  blocks: EmailBlock[];
};

export type RenderedEmail = { subject: string; html: string; text: string };

export type LayoutOptions = {
  siteName: string;
  siteUrl: string;
  /** Footer line under the name, e.g. why the reader gets this email. */
  footerNote: string;
};

/** Escapes text for HTML. Template placeholders like {{ .ConfirmationURL }} pass through unchanged. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const paragraphs = (text: string, style: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;${style}">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

function blockHtml(block: EmailBlock): string {
  switch (block.kind) {
    case "text":
      return paragraphs(block.text, `font-size:16px;line-height:1.6;color:${colors.text};`);
    case "note":
      return paragraphs(block.text, `font-size:13px;line-height:1.5;color:${colors.muted};`);
    case "callout":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="background:${colors.mint};border-radius:8px;padding:14px 16px;font-size:15px;line-height:1.5;color:${colors.text};">${escapeHtml(block.text).replace(/\n/g, "<br>")}</td></tr></table>`;
    case "button":
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;"><tr><td style="border-radius:999px;background:${colors.primary};"><a href="${escapeHtml(block.url)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${fontStack};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(block.label)}</a></td></tr></table>`;
    case "details": {
      const rows = block.rows.filter((row) => row.value);
      if (!rows.length) return "";
      const title = block.title
        ? `<tr><td colspan="2" style="padding:0 0 8px;font-family:${headingFont};font-size:17px;font-weight:600;color:${colors.primary};">${escapeHtml(block.title)}</td></tr>`
        : "";
      const body = rows
        .map(
          (row) =>
            `<tr><td class="detail-label" style="padding:6px 12px 6px 0;font-size:14px;color:${colors.muted};vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</td><td class="detail-value" style="padding:6px 0;font-size:15px;font-weight:600;color:${colors.text};word-break:break-word;${row.mono ? "font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;" : ""}">${escapeHtml(row.value ?? "").replace(/\n/g, "<br>")}</td></tr>`,
        )
        .join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid ${colors.divider};border-bottom:1px solid ${colors.divider};"><tr><td style="padding:12px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${title}${body}</table></td></tr></table>`;
    }
  }
}

function blockText(block: EmailBlock): string {
  switch (block.kind) {
    case "text":
    case "note":
    case "callout":
      return block.text;
    case "button":
      return `${block.label}: ${block.url}`;
    case "details": {
      const rows = block.rows.filter((row) => row.value).map((row) => `${row.label}: ${row.value}`);
      if (!rows.length) return "";
      return [block.title, ...rows].filter(Boolean).join("\n");
    }
  }
}

export function renderEmail(content: EmailContent, options: LayoutOptions): RenderedEmail {
  const { siteName, siteUrl, footerNote } = options;
  const greeting = content.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${colors.text};">${escapeHtml(content.greeting)}</p>`
    : "";

  const html = `<!doctype html>
<html lang="bg">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(content.subject)}</title>
<style>
  @media only screen and (max-width: 620px) {
    .card { padding: 24px 18px !important; border-radius: 0 !important; }
    .outer { padding: 0 !important; }
    .detail-label, .detail-value { display: block !important; width: 100% !important; white-space: normal !important; }
    .detail-label { padding-bottom: 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${colors.bg};font-family:${fontStack};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};">
  <tr><td class="outer" align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
      <tr><td style="padding:0 4px 16px;font-family:${headingFont};font-size:20px;font-weight:600;color:${colors.primary};">
        <a href="${escapeHtml(siteUrl)}" target="_blank" style="color:${colors.primary};text-decoration:none;">${escapeHtml(siteName)}</a>
      </td></tr>
      <tr><td class="card" style="background:${colors.paper};border-radius:12px;padding:32px;border:1px solid ${colors.divider};">
        <h1 style="margin:0 0 20px;font-family:${headingFont};font-size:24px;line-height:1.3;font-weight:600;color:${colors.text};">${escapeHtml(content.heading)}</h1>
        ${greeting}
        ${content.blocks.map(blockHtml).join("\n        ")}
        <p style="margin:8px 0 0;font-size:16px;line-height:1.6;color:${colors.text};">Поздрави,<br>екипът на ${escapeHtml(siteName)}</p>
      </td></tr>
      <tr><td style="padding:16px 4px 0;font-size:12px;line-height:1.5;color:${colors.muted};">
        ${escapeHtml(footerNote)}<br>
        <a href="${escapeHtml(siteUrl)}" target="_blank" style="color:${colors.muted};">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>
`;

  const text = [
    content.heading,
    content.greeting,
    ...content.blocks.map(blockText),
    `Поздрави,\nекипът на ${siteName}`,
    "--",
    footerNote,
    siteUrl,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject: content.subject, html, text };
}
