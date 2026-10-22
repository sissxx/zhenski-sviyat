import { routes } from "@/lib/routes";

/**
 * Monthly memberships. Prices are euro cents; the €21 Viber price is still
 * provisional. Each plan grants access to one or more admin-managed Viber groups.
 * Payment is by card (Stripe, renews automatically) or monthly bank transfer.
 */
export const membershipPlans = {
  beautyClub: {
    slug: "klub-krasota",
    title: "Клуб „Красота, стил и естетика“",
    text: "Професионални съвети за лична грижа, красота и ежедневни навици.",
    priceCents: 800,
    priceProvisional: false,
    href: routes.beautyClub,
    ctaLabel: "Разгледай клуба",
    benefits: [
      "Професионални съвети за поддръжка на кожата, косата и ноктите",
      "Диагностика на кожата",
      "Насоки за хранителен режим и начин на хранене",
      "Общност за красота, стил и естетика",
    ],
  },
  viber: {
    slug: "viber-obshtnost",
    title: "Затворена Viber общност",
    text: "Споделяне на опит, взаимна подкрепа и достъп до специално съдържание.",
    priceCents: 2100,
    priceProvisional: true,
    href: routes.viber,
    ctaLabel: "За общността",
    benefits: [
      "Затворено пространство за общуване и взаимопомощ",
      "Обмен на опит между членовете на общността",
      "Новини за събития и инициативи преди всички останали",
    ],
  },
} as const;

export type MembershipPlan = (typeof membershipPlans)[keyof typeof membershipPlans];
