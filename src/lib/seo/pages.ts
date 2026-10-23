import { routes } from "@/lib/routes";
import { site } from "@/lib/site";

export type SharePage = {
  path: string;
  /** Page title; the layout adds " · Женски свят" unless `absoluteTitle`. */
  title: string;
  absoluteTitle?: boolean;
  description: string;
  /** Small label above the title on the share image. */
  eyebrow: string;
  /** Headline on the share image when it should differ from the title. */
  imageTitle?: string;
};

/**
 * The public pages that search engines and social networks see: their titles and descriptions,
 * what their share images say, and the sitemap. Account, login and checkout pages are left out on purpose.
 */
export const sharePages = {
  home: {
    path: routes.home,
    title: `${site.name} — ${site.tagline}`,
    absoluteTitle: true,
    description: `${site.name}: общност за подкрепа, споделяне и развитие на жените в България.`,
    eyebrow: "Общност · Подкрепа · Развитие",
    imageTitle: "Заедно по-силни.",
  },
  about: {
    path: routes.about,
    title: "За нас",
    description: "Подкрепа, развитие и взаимопомощ: направленията, в които Сдружение Женски свят подкрепя жените.",
    eyebrow: "За сдружението",
  },
  founders: {
    path: routes.founders,
    title: "Учредители",
    description: "Учредителите на Сдружение Женски свят: юристи, психолози и специалисти в здравните грижи и естетиката.",
    eyebrow: "За сдружението",
  },
  goals: {
    path: routes.goals,
    title: "Нашите цели",
    description: "Целите на Сдружение Женски свят: сътрудничество, подкрепа и по-силна роля на жените в обществото.",
    eyebrow: "За сдружението",
  },
  community: {
    path: routes.community,
    title: "Нашата общност",
    description: "Събития, фокус групи, индивидуални консултации и членства в общността на Сдружение Женски свят.",
    eyebrow: "Общност",
  },
  events: {
    path: routes.events,
    title: "Събития",
    description: "Работилници, разговори и срещи с експерти — на живо и онлайн. Запиши се за предстоящите събития.",
    eyebrow: "Събития",
    imageTitle: "Предстоящи събития",
  },
  consultations: {
    path: routes.consultations,
    title: "Индивидуални консултации",
    description: "Запиши час за лична или онлайн консултация със специалист: психолог, адвокат, здравна грижа и развитие.",
    eyebrow: "Консултации",
  },
  beautyClub: {
    path: routes.beautyClub,
    title: "Клуб „Красота, стил и естетика“",
    description: "Клуб с месечен абонамент: професионални насоки за лична грижа и достъп до затворена Viber група.",
    eyebrow: "Членство",
  },
  viber: {
    path: routes.viber,
    title: "Затворена Viber общност",
    description: "Месечно членство в затворената Viber общност на Сдружение Женски свят.",
    eyebrow: "Членство",
  },
  membership: {
    path: routes.membership,
    title: "Членство",
    description: "Месечните членства в Сдружение Женски свят: какво включват, колко струват и как се плащат.",
    eyebrow: "Членство",
  },
  packages: {
    path: routes.packages,
    title: "Пакети и промоции",
    description: "Комбинирани предложения за услуги и членство в Сдружение Женски свят.",
    eyebrow: "Полезно",
  },
  faq: {
    path: routes.faq,
    title: "Често задавани въпроси",
    description: "Отговори на въпроси за членството, събитията, консултациите и плащанията в Сдружение Женски свят.",
    eyebrow: "Полезно",
  },
  support: {
    path: routes.support,
    title: "Партньори и подкрепи ни",
    description: "Партньорите на Сдружение Женски свят и начините да подкрепиш дейността ни с дарение или партньорство.",
    eyebrow: "Подкрепи ни",
  },
  contacts: {
    path: routes.contacts,
    title: "Контакти",
    description: "Свържи се със Сдружение Женски свят чрез контактната форма или националния телефон за връзка.",
    eyebrow: "Контакти",
    imageTitle: "Свържи се с нас",
  },
  privacy: {
    path: routes.privacy,
    title: "Политика за поверителност",
    description: "Как Сдружение Женски свят събира, използва и пази личните данни.",
    eyebrow: "Документи",
  },
  terms: {
    path: routes.terms,
    title: "Общи условия",
    description: "Условия за ползване на сайта, профилите, записванията, консултациите и членствата.",
    eyebrow: "Документи",
  },
} satisfies Record<string, SharePage>;

export type SharePageKey = keyof typeof sharePages;

export const isSharePageKey = (key: string): key is SharePageKey => Object.hasOwn(sharePages, key);

/** The generated share image of a page from the list above. */
export const pageImagePath = (key: SharePageKey) => `/og/${key}`;

/** The generated share image of an event. */
export const eventImagePath = (slug: string) => `/og/sabitiya/${encodeURIComponent(slug)}`;
