/**
 * Where the site lives and whether search engines may index this deployment.
 * No path aliases here: next.config.ts imports this file too.
 */

type Env = Record<string, string | undefined>;

/**
 * The public address until the .org domain is chosen. To switch, set NEXT_PUBLIC_SITE_URL in Vercel
 * (Production) to the new address, or change this default.
 */
export const DEFAULT_SITE_URL = "https://zhenski-sviyat.vercel.app";

/** The canonical origin for links in metadata, share images, the sitemap and structured data. No trailing slash. */
export function siteUrl(env: Env = process.env): string {
  return (env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

/**
 * Only the production deployment on Vercel may be indexed. Previews, local builds and CI stay out
 * of search results (robots.txt, the robots meta tag and an X-Robots-Tag header all say so).
 */
export function isIndexable(env: Env = process.env): boolean {
  return env.VERCEL_ENV === "production";
}

/** An absolute URL on the canonical origin, e.g. absoluteUrl("/sabitiya/x"). */
export function absoluteUrl(path: string, env: Env = process.env): string {
  return `${siteUrl(env)}${path.startsWith("/") ? path : `/${path}`}`;
}
