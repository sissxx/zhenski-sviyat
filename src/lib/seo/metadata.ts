import type { Metadata } from "next";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/locale";
import { eventPath } from "@/lib/routes";
import { eventLocationLabel, type PublicEvent } from "@/lib/events/types";
import { eventImagePath, pageImagePath, sharePages, type SharePageKey } from "./pages";

/** Facebook's and Viber's preferred size for a link preview image. */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

type ShareMetadataInput = {
  title: string;
  absoluteTitle?: boolean;
  description: string;
  /** Site path of the page; becomes the canonical URL and og:url. */
  path: string;
  /** Site path of the share image (1200×630 PNG). */
  image: string;
  imageAlt: string;
};

/**
 * Title, description, canonical URL, Open Graph and Twitter tags for one page. Relative URLs are made
 * absolute with `metadataBase` from the root layout. Next.js replaces (not merges) `openGraph` from the
 * layout, so every field is set here.
 */
export function shareMetadata({ title, absoluteTitle, description, path, image, imageAlt }: ShareMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${site.shortName}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "bg_BG",
      siteName: site.name,
      url: path,
      title: fullTitle,
      description,
      images: [{ url: image, ...SHARE_IMAGE_SIZE, alt: imageAlt, type: "image/png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}

/** Metadata for one of the public pages in `sharePages`. */
export function pageMetadata(key: SharePageKey): Metadata {
  const page = sharePages[key];
  return shareMetadata({
    ...page,
    image: pageImagePath(key),
    imageAlt: `${"imageTitle" in page ? page.imageTitle : page.title} — ${site.name}`,
  });
}

/** "12 ноември 2026 г. · София · присъствено", used when an event has no summary. */
export const eventFactsLine = (event: PublicEvent) => `${formatDate(event.startsAt)} · ${eventLocationLabel(event)}`;

/** Metadata for an event page from the database. */
export function eventMetadata(event: PublicEvent): Metadata {
  return shareMetadata({
    title: event.title,
    description: event.summary?.trim() || `${event.title}: ${eventFactsLine(event)}.`,
    path: eventPath(event.slug),
    image: eventImagePath(event.slug),
    imageAlt: `${event.title} — ${eventFactsLine(event)}`,
  });
}
