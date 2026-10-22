import { eventPath } from "@/lib/routes";

/**
 * Sample events from the Figma events screens (frames 8:664, 8:731). They will
 * come from the `events` table once Supabase is connected. Dates are UTC ISO
 * strings shown in Europe/Sofia time; prices are euro cents (0 = free).
 * Prices, addresses and capacity are placeholders until NSJS confirms them.
 */

export const eventCategories = {
  "lichnostno-razvitie": "Личностно развитие",
  zdrave: "Здраве",
  "pravna-podkrepa": "Правна подкрепа",
} as const;

export type EventCategory = keyof typeof eventCategories;
export type EventFormat = "in_person" | "online";

export type SiteEvent = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  startsAt: string;
  category: EventCategory;
  format: EventFormat;
  city?: string;
  /** Shown only once confirmed; until then the page says the address is coming. */
  address?: string;
  priceCents: number;
  capacity: number;
  spotsLeft: number;
};

export const events: SiteEvent[] = [
  {
    slug: "zhenska-sila-rabotilnitsa",
    title: "Женска сила — работилница",
    summary: "Практическа среща за увереност, цели и развитие.",
    description:
      "Практическа работилница с упражнения и разговори, които помагат да разпознаем силните си страни, да поставяме лични цели и да изграждаме увереност. Ще има време за споделяне, въпроси и нови запознанства.",
    startsAt: "2027-05-15T15:30:00Z",
    category: "lichnostno-razvitie",
    format: "in_person",
    city: "София",
    priceCents: 2000,
    capacity: 25,
    spotsLeft: 12,
  },
  {
    slug: "razgovor-za-balansa",
    title: "Разговор за баланса",
    summary: "Разговор за работа, личен живот и граници.",
    description:
      "Онлайн среща в малка група за това как да намираме баланс между работа, семейство и време за себе си, и как да поставяме граници, без да се чувстваме виновни.",
    startsAt: "2027-05-22T15:00:00Z",
    category: "lichnostno-razvitie",
    format: "online",
    priceCents: 0,
    capacity: 40,
    spotsLeft: 40,
  },
  {
    slug: "pravni-vaprosi-i-otgovori",
    title: "Правни въпроси и отговори",
    summary: "Полезни насоки и среща със специалист.",
    description:
      "Среща с адвокат от сдружението, на която ще разгледаме често срещани казуси — трудови права, семейно право и защита от тормоз — и ще отговорим на въпросите ви.",
    startsAt: "2027-06-05T15:00:00Z",
    category: "pravna-podkrepa",
    format: "in_person",
    city: "София",
    priceCents: 1500,
    capacity: 30,
    spotsLeft: 0,
  },
];

export const findEvent = (slug: string) => events.find((event) => event.slug === slug);

export const eventHref = (event: SiteEvent) => eventPath(event.slug);

/** "София · присъствено" / "Онлайн" */
export function eventLocationLabel(event: SiteEvent): string {
  return event.format === "online" ? "Онлайн" : `${event.city ?? "Предстои"} · присъствено`;
}
