import "server-only";
import { headers } from "next/headers";

/**
 * The site's own origin for links in emails and Stripe return URLs. NEXT_PUBLIC_SITE_URL wins;
 * otherwise the request's host, so Vercel previews send people back to the same preview.
 */
export async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
