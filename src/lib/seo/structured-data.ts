import { site } from "@/lib/site";
import { CURRENCY } from "@/lib/locale";
import { eventPath } from "@/lib/routes";
import type { PublicEvent } from "@/lib/events/types";
import { absoluteUrl } from "./config";
import { eventImagePath, sharePages } from "./pages";

/**
 * schema.org data (JSON-LD) that search engines read for the organisation and for events.
 * Only facts the site already shows: no phone, address or social profiles until the association
 * publishes them.
 */

type JsonLd = Record<string, unknown>;

const organizationId = () => absoluteUrl("/#organization");

/** The association, as a non-profit (schema.org NGO). */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": organizationId(),
    name: site.name,
    alternateName: site.shortName,
    slogan: site.tagline,
    description: sharePages.home.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo-full.png"),
    areaServed: { "@type": "Country", name: "България" },
  };
}

/** The site itself, so search engines show the association's name for it. */
export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: site.name,
    alternateName: site.shortName,
    url: absoluteUrl("/"),
    inLanguage: "bg",
    publisher: { "@id": organizationId() },
  };
}

const attendanceModes: Record<PublicEvent["format"], string> = {
  in_person: "https://schema.org/OfflineEventAttendanceMode",
  online: "https://schema.org/OnlineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

/** Ticket availability for search results; left out once sign-up is over. */
const offerAvailability: Partial<Record<PublicEvent["availability"], string>> = {
  open: "https://schema.org/InStock",
  full: "https://schema.org/SoldOut",
  not_open_yet: "https://schema.org/PreSale",
};

function eventLocation(event: PublicEvent, url: string): JsonLd | JsonLd[] {
  // The online link is private (only confirmed attendees see it), so the virtual location is the event page.
  const virtual = { "@type": "VirtualLocation", url };
  if (event.format === "online") return virtual;
  const place: JsonLd = {
    "@type": "Place",
    name: event.venueName ?? event.city ?? site.name,
    address: {
      "@type": "PostalAddress",
      ...(event.venueAddress ? { streetAddress: event.venueAddress } : {}),
      ...(event.city ? { addressLocality: event.city } : {}),
      addressCountry: "BG",
    },
  };
  return event.format === "hybrid" ? [place, virtual] : place;
}

/** One event from the database, for Google's event results. */
export function eventJsonLd(event: PublicEvent): JsonLd {
  const url = absoluteUrl(eventPath(event.slug));
  const availability = offerAvailability[event.availability];
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    ...(event.summary ? { description: event.summary } : {}),
    url,
    image: [absoluteUrl(eventImagePath(event.slug))],
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    eventStatus: event.availability === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: attendanceModes[event.format],
    location: eventLocation(event, url),
    isAccessibleForFree: event.priceCents === 0,
    inLanguage: "bg",
    organizer: { "@type": "NGO", "@id": organizationId(), name: site.name, url: absoluteUrl("/") },
    offers: {
      "@type": "Offer",
      url,
      price: (event.priceCents / 100).toFixed(2),
      priceCurrency: CURRENCY,
      ...(availability ? { availability } : {}),
      ...(event.registrationOpensAt ? { validFrom: event.registrationOpensAt } : {}),
    },
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so text can't close the tag. */
export const serializeJsonLd = (data: JsonLd | JsonLd[]) => JSON.stringify(data).replace(/</g, "\\u003c");
