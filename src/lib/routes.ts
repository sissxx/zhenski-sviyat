/**
 * Public URLs. Slugs are Latin transliterations so links stay readable when shared.
 * Admin pages live under /admin (see adminRoutes in src/lib/admin/routes.ts).
 */
export const routes = {
  home: "/",
  about: "/za-nas",
  /** Sections of the За нас page (they used to be pages of their own, which now redirect here). */
  aboutGoals: "/za-nas#tseli",
  aboutTeam: "/za-nas#ekip",
  events: "/sabitiya",
  consultations: "/konsultatsii",
  membership: "/chlenstvo",
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
  accountSpecialist: "/profil/spetsialist",
  privacy: "/poveritelnost",
  terms: "/obshti-usloviya",
  cookies: "/biskvitki",
  admin: "/admin",
} as const;

export const eventPath = (slug: string) => `${routes.events}/${slug}`;
export const eventRegistrationPath = (slug: string) => `${eventPath(slug)}/zapisvane`;
export const eventConfirmationPath = (slug: string) => `${eventPath(slug)}/potvarzhdenie`;
/** Calendar file (.ics) for an event, and for one of the member's own consultations. */
export const eventCalendarPath = (slug: string) => `${eventPath(slug)}/kalendar`;
export const consultationCalendarPath = (bookingId: string) => `/profil/konsultatsii/${bookingId}/kalendar`;

export const consultationConfirmationPath = (bookingId: string) => `${routes.consultations}/potvarzhdenie?zapis=${bookingId}`;
export const consultationReschedulePath = (bookingId: string) => `${routes.accountConsultations}/${bookingId}/premesti`;

/**
 * "Стани член" for one plan: a visitor signs up and then lands on their subscriptions with the plan picked;
 * a signed-in member skips sign-up (the proxy follows `next`) and goes straight there.
 */
export const joinPlanPath = (planSlug: string) =>
  `${routes.register}?plan=${encodeURIComponent(planSlug)}&next=${encodeURIComponent(`${routes.accountSubscriptions}?plan=${planSlug}`)}`;

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
export function safeNextPath(next: string | null | undefined, fallback: string = routes.accountDetails): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export const accountNav: NavItem[] = [
  { label: "Моите данни", href: routes.accountDetails },
  { label: "Моите събития", href: routes.accountEvents },
  { label: "Моите консултации", href: routes.accountConsultations },
  { label: "Моите абонаменти", href: routes.accountSubscriptions },
];

export type NavItem = { label: string; href: string };

/** Extra account section for people linked to a specialist profile. */
export const specialistNavItem: NavItem = { label: "Моят график", href: routes.accountSpecialist };

/** The logo links home, so the desktop menu leaves "Начало" out; only the mobile menu shows it. */
export const homeNavItem: NavItem = { label: "Начало", href: routes.home };

/** Five links keep the header calm; Въпроси and Подкрепи ни live in the footer and on the homepage. */
export const mainNav: NavItem[] = [
  { label: "За нас", href: routes.about },
  { label: "Събития", href: routes.events },
  { label: "Консултации", href: routes.consultations },
  { label: "Членство", href: routes.membership },
  { label: "Контакти", href: routes.contacts },
];

/** Pages the short desktop menu leaves to the footer; the phone menu lists them too, since the footer is far down. */
export const mobileExtraNav: NavItem[] = [
  { label: "Въпроси", href: routes.faq },
  { label: "Подкрепи ни", href: routes.support },
];

export const footerNav: { title: NavItem; links: NavItem[] }[] = [
  {
    title: { label: "За сдружението", href: routes.about },
    links: [
      { label: "За нас", href: routes.about },
      { label: "Нашите цели", href: routes.aboutGoals },
      { label: "Учредители и екип", href: routes.aboutTeam },
    ],
  },
  {
    title: { label: "Участвай", href: routes.membership },
    links: [
      { label: "Събития", href: routes.events },
      { label: "Консултации", href: routes.consultations },
      { label: "Членство", href: routes.membership },
      { label: "Пакети и промоции", href: routes.packages },
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
