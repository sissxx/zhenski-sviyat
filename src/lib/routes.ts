/**
 * Public URLs. Slugs are Latin transliterations so links stay readable when shared.
 * Only the homepage exists so far; the rest render the 404 page until built.
 */
export const routes = {
  home: "/",
  about: "/za-nsjs",
  founders: "/uchrediteli",
  goals: "/tseli-i-sabitiya",
  community: "/nashata-obshtnost",
  events: "/sabitiya",
  consultations: "/konsultatsii",
  beautyClub: "/klub-krasota-stil-estetika",
  viber: "/viber-obshtnost",
  packages: "/paketi-i-promotsii",
  faq: "/chesto-zadavani-vaprosi",
  support: "/podkrepi-ni",
  contacts: "/kontakti",
  register: "/registratsiya",
  privacy: "/poveritelnost",
  terms: "/obshti-usloviya",
} as const;

export const eventPath = (slug: string) => `${routes.events}/${slug}`;

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Начало", href: routes.home },
  { label: "За НСЖС", href: routes.about },
  { label: "Нашата общност", href: routes.community },
  { label: "Събития", href: routes.events },
  { label: "Въпроси", href: routes.faq },
  { label: "Подкрепи ни", href: routes.support },
  { label: "Контакти", href: routes.contacts },
];

export const footerNav: { title: NavItem; links: NavItem[] }[] = [
  {
    title: { label: "За НСЖС", href: routes.about },
    links: [
      { label: "Обща информация", href: routes.about },
      { label: "Учредители", href: routes.founders },
      { label: "Нашите цели", href: routes.goals },
    ],
  },
  {
    title: { label: "Нашата общност", href: routes.community },
    links: [
      { label: "Събития", href: routes.events },
      { label: "Фокус групи", href: routes.community },
      { label: "Консултации", href: routes.consultations },
    ],
  },
  {
    title: { label: "Полезно", href: routes.faq },
    links: [
      { label: "Често задавани въпроси", href: routes.faq },
      { label: "Подкрепи ни", href: routes.support },
      { label: "Контакти", href: routes.contacts },
    ],
  },
];
