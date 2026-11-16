import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { isIndexable } from "./src/lib/seo/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Link-preview bots that read only the HTML get the share tags in <head> instead of streamed in later.
  // Next.js already lists Facebook, WhatsApp, Twitter and others; Viber and Telegram are added here.
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|Viber|TelegramBot`, "i"),
  // Fonts and logo for the share images, read from disk when an event's image is drawn on request.
  outputFileTracingIncludes: {
    "/og/sabitiya/[slug]": ["./src/assets/og/**/*"],
  },
  // Pages merged into others (site review, 2026-11): old links and search results land on the right section.
  async redirects() {
    return [
      { source: "/uchrediteli", destination: "/za-nas#ekip", permanent: true },
      { source: "/tseli-i-sabitiya", destination: "/za-nas#tseli", permanent: true },
      { source: "/nashata-obshtnost", destination: "/chlenstvo", permanent: true },
      { source: "/klub-krasota-stil-estetika", destination: "/chlenstvo#plan-klub-krasota", permanent: true },
      { source: "/viber-obshtnost", destination: "/chlenstvo#plan-viber-obshtnost", permanent: true },
    ];
  },
  async headers() {
    // Previews and local builds: keep every response (pages, images, files) out of search indexes.
    if (isIndexable()) return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
