import { eventPath, routes } from "@/lib/routes";

/**
 * Homepage copy and sample data from the Figma homepage (frame 1:25).
 * Events, plans, founders and FAQ will move to the database and admin panel;
 * until then they live here so the page can be reviewed.
 */

export const topics = [
  { icon: "♡", title: "Психологическа подкрепа", text: "Разбиране и пространство" },
  { icon: "⚖", title: "Юридическа подкрепа", text: "Насоки и професионална помощ" },
  { icon: "✧", title: "Личностно израстване", text: "Увереност и развитие" },
  { icon: "＋", title: "Здраве и грижа", text: "Информиран избор" },
  { icon: "❀", title: "Красота и естетика", text: "Съвети за лична грижа" },
  { icon: "◎", title: "Финансова култура", text: "Уверени решения" },
];

export const services = [
  {
    title: "Индивидуални консултации",
    text: "Лични и онлайн срещи със специалисти в различни области.",
    cta: { label: "Заяви консултация", href: routes.consultations },
    primary: true,
  },
  {
    title: "Фокус групи",
    text: "Безопасно пространство за споделяне, разговор и обмяна на опит.",
    cta: { label: "Научи повече", href: routes.community },
    primary: false,
  },
  {
    title: "Подкрепи ни",
    text: "Помогни ни да развиваме инициативи и да достигаме до повече жени.",
    cta: { label: "Направи дарение", href: routes.support },
    primary: true,
  },
];

export const missionStats = [
  { value: "8+", label: "направления" },
  { value: "100%", label: "подкрепа" },
  { value: "Заедно", label: "по-силни" },
];

/** Sample events. Dates are UTC ISO strings, shown in Europe/Sofia time. */
export const upcomingEvents = [
  {
    slug: "zhenska-sila-rabotilnitsa",
    title: "Женска сила — работилница",
    summary: "Личностно развитие и увереност",
    startsAt: "2027-05-15T15:00:00Z",
    location: "София · присъствено",
  },
  {
    slug: "fokus-grupa-balans",
    title: "Фокус група: баланс",
    summary: "Работа, личен живот и граници",
    startsAt: "2027-05-22T15:00:00Z",
    location: "Онлайн",
  },
  {
    slug: "pravni-vaprosi-i-otgovori",
    title: "Правни въпроси и отговори",
    summary: "Практични насоки от специалист",
    startsAt: "2027-06-05T15:00:00Z",
    location: "София · присъствено",
  },
].map((event) => ({ ...event, href: eventPath(event.slug) }));

/** Monthly plans. Prices are in euro cents; €21 for Viber is still provisional. */
export const membershipPlans = [
  {
    title: "Клуб „Красота, стил и естетика“",
    text: "Професионални съвети за лична грижа, красота и ежедневни навици.",
    priceCents: 800,
    cta: { label: "Разгледай клуба", href: routes.beautyClub },
  },
  {
    title: "Затворена Viber общност",
    text: "Споделяне на опит, взаимна подкрепа и достъп до специално съдържание.",
    priceCents: 2100,
    cta: { label: "За общността", href: routes.viber },
  },
];

export const founders = [
  "адв. Ирена Станчева",
  "Лили Гълъбова",
  "Магдалина Пенчева",
  "Оля Димитрова",
  "Румяна Петрова",
  "Славина Петрова",
  "адв. Цветелина Славчева",
];

/** Questions are from Figma; the answers are draft copy awaiting NSJS approval. */
export const faqPreview = [
  {
    question: "Как мога да стана член?",
    answer:
      "Създай безплатен профил в сайта и избери членството, което ти подхожда. След потвърждаване на плащането достъпът се активира в профила ти.",
  },
  {
    question: "Как се записвам за събитие?",
    answer:
      "Отвори събитието, натисни „Запиши се“ и попълни формата. За платените събития плащането става онлайн с карта или по банков път.",
  },
  {
    question: "Как работят месечните абонаменти?",
    answer:
      "Абонаментите се подновяват всеки месец. Можеш да ги спреш по всяко време от своя профил, а достъпът остава активен до края на платения период.",
  },
  {
    question: "Мога ли да се включа онлайн?",
    answer:
      "Да. Част от събитията и консултациите се провеждат онлайн. Начинът на провеждане е отбелязан при всяко събитие.",
  },
  {
    question: "Как мога да подкрепя инициативите?",
    answer:
      "Можеш да направиш дарение, да станеш доброволка или партньор. Повече подробности ще намериш в страницата „Подкрепи ни“.",
  },
];
