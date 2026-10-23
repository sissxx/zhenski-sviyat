import { supportAreas } from "@/content/about";
import { founders } from "@/content/founders";
import { routes } from "@/lib/routes";

/**
 * Homepage copy from the Figma homepage (frame 1:25). Events, plans, founders
 * and FAQ are shared with the inner pages and live in their own content files.
 */

export const topics = [
  { icon: "♡", title: "Психоло\u00adгическа подкрепа", text: "Разбиране и пространство" }, // Soft hyphen: breaks as "Психоло-гическа" on 320px screens.
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

/** Facts counted from the site's own content, so they stay true when that content changes. */
export const missionStats = [
  { value: String(supportAreas.length), label: "направления на подкрепа" },
  { value: String(founders.length), label: "учредители специалисти" },
  { value: "Онлайн", label: "и на живо" },
];
