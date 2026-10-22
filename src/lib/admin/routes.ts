import { routes } from "@/lib/routes";

/** Admin URLs. Each managed list has `…/nov` for a new item and `…/<id>` to edit one. */
const base = routes.admin;

export const adminRoutes = {
  home: base,
  events: `${base}/sabitiya`,
  bookings: `${base}/konsultatsii`,
  consultationTypes: `${base}/vidove-konsultatsii`,
  specialists: `${base}/spetsialisti`,
  payments: `${base}/plashtaniya`,
  plans: `${base}/chlenstvo`,
  subscriptions: `${base}/abonamenti`,
  viber: `${base}/viber`,
  users: `${base}/potrebiteli`,
  faqs: `${base}/vaprosi`,
  partners: `${base}/partnyori`,
  promotions: `${base}/promotsii`,
  team: `${base}/ekip`,
  announcements: `${base}/obyavi`,
  settings: `${base}/nastroyki`,
} as const;

export const newPath = (list: string) => `${list}/nov`;
export const itemPath = (list: string, id: string) => `${list}/${id}`;
export const eventParticipantsPath = (id: string) => `${adminRoutes.events}/${id}/uchastnichki`;

export type AdminNavGroup = { title: string; items: { label: string; href: string }[] };

export const adminNav: AdminNavGroup[] = [
  { title: "", items: [{ label: "Табло", href: adminRoutes.home }] },
  {
    title: "Дейност",
    items: [
      { label: "Събития", href: adminRoutes.events },
      { label: "Консултации", href: adminRoutes.bookings },
      { label: "Плащания", href: adminRoutes.payments },
      { label: "Абонаменти", href: adminRoutes.subscriptions },
      { label: "Viber достъп", href: adminRoutes.viber },
      { label: "Потребители", href: adminRoutes.users },
    ],
  },
  {
    title: "Предлагане",
    items: [
      { label: "Видове консултации", href: adminRoutes.consultationTypes },
      { label: "Специалисти", href: adminRoutes.specialists },
      { label: "Членство и планове", href: adminRoutes.plans },
    ],
  },
  {
    title: "Съдържание",
    items: [
      { label: "Въпроси (ЧЗВ)", href: adminRoutes.faqs },
      { label: "Партньори", href: adminRoutes.partners },
      { label: "Промоции", href: adminRoutes.promotions },
      { label: "Учредители и екип", href: adminRoutes.team },
      { label: "Обяви", href: adminRoutes.announcements },
    ],
  },
  { title: "", items: [{ label: "Настройки", href: adminRoutes.settings }] },
];
