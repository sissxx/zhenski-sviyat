import type { MetadataRoute } from "next";
import { listPastEvents, listUpcomingEvents } from "@/lib/events/queries";
import { eventPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { sharePages } from "@/lib/seo/pages";

/** The public pages plus every published event, upcoming and recent. Built per request, like the event pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [upcoming, past] = await Promise.all([listUpcomingEvents(), listPastEvents(50)]);
  const pages: MetadataRoute.Sitemap = Object.values(sharePages).map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.path === sharePages.events.path ? "daily" : "monthly",
    priority: page.path === sharePages.home.path ? 1 : 0.7,
  }));
  const events: MetadataRoute.Sitemap = [...upcoming, ...past]
    .filter((event) => event.availability !== "cancelled")
    .map((event) => ({
      url: absoluteUrl(eventPath(event.slug)),
      changeFrequency: "weekly",
      priority: event.availability === "past" ? 0.3 : 0.8,
    }));
  return [...pages, ...events];
}
