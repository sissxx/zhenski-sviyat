/**
 * Public URLs. Slugs are Latin transliterations so links stay readable when shared.
 * Admin pages live under /admin (see adminRoutes in src/lib/admin/routes.ts).
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
  login: "/vhod",
  forgotPassword: "/zabravena-parola",
  newPassword: "/nova-parola",
  authConfirm: "/auth/confirm",
  account: "/profil",
  accountDetails: "/profil/danni",
  accountEvents: "/profil/sabitiya",
  accountConsultations: "/profil/konsultatsii",
  accountSubscriptions: "/profil/abonamenti",
  privacy: "/poveritelnost",
  terms: "/obshti-usloviya",
  admin: "/admin",
} as const;

export const eventPath = (slug: string) => `${routes.events}/${slug}`;
export const eventRegistrationPath = (slug: string) => `${eventPath(slug)}/zapisvane`;
export const eventConfirmationPath = (slug: string) => `${eventPath(slug)}/potvarzhdenie`;

/** Contact page with the subject field filled in, e.g. from a package's "Запитване" button. */
export const contactPath = (subject: string) => `${routes.contacts}?tema=${encodeURIComponent(subject)}`;

/** Pages that need a signed-in user. The proxy sends visitors to the login page first. */
export const protectedPrefixes: string[] = [routes.account, routes.admin];

/** Login and sign-up pages, which a signed-in user skips. */
export const guestOnlyPaths: string[] = [routes.login, routes.register];

/** Login link that brings the user back to `next` afterwards. */
export const loginPath = (next?: string) =>
  next ? `${routes.login}?next=${encodeURIComponent(next)}` : routes.login;

/**
 * A same-site path to continue to after login or an email link, or the fallback.
 * Rejects absolute and protocol-relative URLs so the parameter can't send users to another site.
 */
export function safeNextPath(next: string | null | undefined, fallback: string = routes.account): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export const accountNav: NavItem[] = [
  { label: "Начало", href: routes.account },
  { label: "Моите данни", href: routes.accountDetails },
  { label: "Моите събития", href: routes.accountEvents },
  { label: "Моите консултации", href: routes.accountConsultations },
  { label: "Моите абонаменти", href: routes.accountSubscriptions },
];

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
