import { routes } from "@/lib/routes";

/**
 * Homepage copy from the Figma homepage (frame 1:25). Events, plans, founders
 * and FAQ are shared with the inner pages and live in their own content files.
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
