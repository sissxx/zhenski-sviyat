/**
 * Public URLs. Slugs are Latin transliterations so links stay readable when shared.
 * Account, legal and admin pages are not built yet and render the 404 page.
 */
export const routes = {
  home: "/",
  about: "/za-nas",
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
export const eventRegistrationPath = (slug: string) => `${eventPath(slug)}/zapisvane`;
export const eventConfirmationPath = (slug: string) => `${eventPath(slug)}/potvarzhdenie`;

/** Contact page with the subject field filled in, e.g. from a package's "Запитване" button. */
export const contactPath = (subject: string) => `${routes.contacts}?tema=${encodeURIComponent(subject)}`;

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Начало", href: routes.home },
  { label: "За нас", href: routes.about },
  { label: "Нашата общност", href: routes.community },
  { label: "Събития", href: routes.events },
  { label: "Въпроси", href: routes.faq },
  { label: "Подкрепи ни", href: routes.support },
  { label: "Контакти", href: routes.contacts },
];

export const footerNav: { title: NavItem; links: NavItem[] }[] = [
  {
    title: { label: "За сдружението", href: routes.about },
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
      { label: "Пакети и промоции", href: routes.packages },
      { label: "Подкрепи ни", href: routes.support },
      { label: "Контакти", href: routes.contacts },
    ],
  },
];
