import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { inter, lora } from "@/theme/fonts";
import { brand } from "@/theme/tokens";
import { Providers } from "./providers";
import { site } from "@/lib/site";
import { isIndexable, siteUrl } from "@/lib/seo/config";
import { pageMetadata } from "@/lib/seo/metadata";

const home = pageMetadata("home");

/**
 * Defaults for every page. Public pages set their own title, description, canonical URL and share
 * image (src/lib/seo); the rest fall back to the homepage preview.
 */
export const metadata: Metadata = {
  ...home,
  metadataBase: new URL(siteUrl()),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.shortName}` },
  // Each page names its own canonical URL; inheriting the homepage's would point them all home.
  alternates: undefined,
  openGraph: { ...home.openGraph, url: undefined },
  applicationName: site.name,
  robots: isIndexable()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: brand.primary,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bg" className={`${inter.variable} ${lora.variable}`}>
      <body>
        <Providers>
          <Box
            component="a"
            href="#main"
            sx={{
              position: "absolute",
              left: -9999,
              "&:focus": { left: 16, top: 16, zIndex: 2000, bgcolor: "background.paper", p: 1.5, borderRadius: "8px" },
            }}
          >
            Към съдържанието
          </Box>
          <SiteHeader />
          <Box component="main" id="main">
            {children}
          </Box>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
