import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";
import { brand } from "@/theme/tokens";
import { siteUrl } from "./config";
import { SHARE_IMAGE_SIZE } from "./metadata";

/**
 * Link preview images (1200×630 PNG) in the site's look: cream background, green Lora headline,
 * Inter text and the logo. Fonts are the Latin and Cyrillic subsets of Lora and Inter (OFL, see
 * src/assets/og), because the image renderer has no Cyrillic font of its own.
 */

const assetDir = join(process.cwd(), "src/assets/og");

type Font = { name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" };

let assets: Promise<{ fonts: Font[]; logo: string }> | undefined;

function loadAssets() {
  assets ??= (async () => {
    const file = (name: string) => readFile(join(assetDir, name));
    const [loraLatin, loraCyrillic, interLatin, interCyrillic, interLatinBold, interCyrillicBold, logo] = await Promise.all([
      file("lora-latin-700-normal.woff"),
      file("lora-cyrillic-700-normal.woff"),
      file("inter-latin-400-normal.woff"),
      file("inter-cyrillic-400-normal.woff"),
      file("inter-latin-600-normal.woff"),
      file("inter-cyrillic-600-normal.woff"),
      file("logo-icon.png"),
    ]);
    return {
      fonts: [
        { name: "Lora", data: loraLatin, weight: 700, style: "normal" },
        { name: "Lora Cyrillic", data: loraCyrillic, weight: 700, style: "normal" },
        { name: "Inter", data: interLatin, weight: 400, style: "normal" },
        { name: "Inter Cyrillic", data: interCyrillic, weight: 400, style: "normal" },
        { name: "Inter", data: interLatinBold, weight: 600, style: "normal" },
        { name: "Inter Cyrillic", data: interCyrillicBold, weight: 600, style: "normal" },
      ],
      logo: `data:image/png;base64,${logo.toString("base64")}`,
    };
  })();
  return assets;
}

// The renderer keeps one font per name and weight, so each subset gets its own name and a fallback list.
const serif = "Lora, Lora Cyrillic";
const sans = "Inter, Inter Cyrillic";

/** Shortens text to `max` characters at a word boundary, with an ellipsis. */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** Headline size that keeps long titles within three lines. */
const titleSize = (title: string) => (title.length <= 28 ? 76 : title.length <= 48 ? 64 : 52);

export type ShareImageContent = {
  eyebrow: string;
  title: string;
  /** One short paragraph under the title. */
  text?: string;
  /** Facts shown as a row of pills, e.g. date, place, price. */
  facts?: string[];
  headers?: Record<string, string>;
};

export async function renderShareImage({ eyebrow, title, text, facts = [], headers }: ShareImageContent): Promise<ImageResponse> {
  const { fonts, logo } = await loadAssets();
  const headline = clip(title, 90);
  const host = new URL(siteUrl()).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: brand.bg,
          fontFamily: sans,
          color: brand.text,
        }}
      >
        {/* Soft circles on the right, like the botanical shapes on the site. */}
        <div style={{ position: "absolute", right: -200, top: -170, width: 470, height: 470, borderRadius: 9999, backgroundColor: brand.mint }} />
        <div style={{ position: "absolute", right: -40, bottom: -170, width: 320, height: 320, borderRadius: 9999, backgroundColor: brand.sageLight }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, backgroundColor: brand.primary }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 72px 64px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not a page */}
            <img src={logo} width={92} height={96} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: 2.5, color: brand.accent }}>СДРУЖЕНИЕ</div>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 40, lineHeight: 1.1, color: brand.primary }}>{site.shortName}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 840 }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: brand.accent }}>
              {clip(eyebrow, 48)}
            </div>
            <div style={{ fontFamily: serif, fontWeight: 700, fontSize: titleSize(headline), lineHeight: 1.12, color: brand.primary }}>
              {headline}
            </div>
            {text && <div style={{ fontSize: 28, lineHeight: 1.35, color: brand.muted }}>{clip(text, 120)}</div>}
            {facts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                {facts.map((fact) => (
                  <div
                    key={fact}
                    style={{
                      display: "flex",
                      fontSize: 24,
                      fontWeight: 600,
                      color: brand.dark,
                      backgroundColor: brand.paper,
                      border: `2px solid ${brand.cardBorder}`,
                      borderRadius: 9999,
                      padding: "8px 22px",
                    }}
                  >
                    {clip(fact, 40)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: brand.accent }}>{host}</div>
        </div>
      </div>
    ),
    { ...SHARE_IMAGE_SIZE, fonts, headers },
  );
}
