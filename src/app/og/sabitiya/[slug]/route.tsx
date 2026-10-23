import { formatDateTime } from "@/lib/locale";
import { getEventBySlug } from "@/lib/events/queries";
import { eventLocationLabel, eventPriceLabel, type PublicEvent } from "@/lib/events/types";
import { renderShareImage } from "@/lib/seo/share-image";

const eyebrows: Record<PublicEvent["availability"], string> = {
  open: "Събитие",
  full: "Събитие · няма свободни места",
  not_open_yet: "Събитие · записването предстои",
  closed: "Събитие",
  past: "Отминало събитие",
  cancelled: "Отменено събитие",
};

/**
 * Share image of one event, drawn from its current title, date and place. Social networks cache
 * previews themselves; the CDN keeps it for an hour so edits show up the same day.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug(decodeURIComponent((await params).slug));
  if (!event) return new Response("Not found", { status: 404 });
  return renderShareImage({
    eyebrow: eyebrows[event.availability],
    title: event.title,
    facts: [formatDateTime(event.startsAt), eventLocationLabel(event), eventPriceLabel(event)],
    headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
