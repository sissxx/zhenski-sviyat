import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { inter, lora } from "@/theme/fonts";
import { brand } from "@/theme/tokens";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Женски свят — НСЖС",
    template: "%s · Женски свят",
  },
  description:
    "Национална съюзна женска солидарност: общност за подкрепа, споделяне и развитие на жените в България.",
  openGraph: { locale: "bg_BG", type: "website", siteName: "Женски свят" },
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
