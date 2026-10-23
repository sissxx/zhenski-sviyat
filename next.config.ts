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
  async headers() {
    // Previews and local builds: keep every response (pages, images, files) out of search indexes.
    if (isIndexable()) return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
