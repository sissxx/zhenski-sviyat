import type { MetadataRoute } from "next";
import { routes } from "@/lib/routes";
import { absoluteUrl, isIndexable } from "@/lib/seo/config";

/** Production lets crawlers in, except private areas; every other deployment shuts them out. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [routes.admin, routes.account, "/api/", "/auth/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
