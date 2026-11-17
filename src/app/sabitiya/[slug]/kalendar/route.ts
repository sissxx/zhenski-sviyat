import { buildIcs, icsResponse } from "@/lib/calendar/ics";
import { getEventBySlug } from "@/lib/events/queries";
import { eventPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { site } from "@/lib/site";

/**
 * "Добави в календара" for an event: a public .ics file with the date, place and a link to the event page.
 * The online link stays out of it on purpose; participants get it by email and in their profile.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }): Promise<Response> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const venue = [event.venueName, event.venueAddress, event.city].filter(Boolean).join(", ");
  const location = event.format === "online" ? "Онлайн" : event.format === "hybrid" ? [venue, "и онлайн"].filter(Boolean).join(" ") : venue;
  const url = absoluteUrl(eventPath(event.slug));
  return icsResponse(
    buildIcs({
      uid: `event-${event.id}@zhenski-sviyat`,
      title: `${event.title} · ${site.shortName}`,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location,
      description: [event.summary, url].filter(Boolean).join("\n\n"),
      url,
    }),
    `sabitie-${event.slug}`,
  );
}
