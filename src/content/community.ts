import { contactPath, routes } from "@/lib/routes";

/** "Нашата общност" activities from Figma frame 12:166. */
export const communityAreas = [
  {
    title: "Събития",
    text: "Срещи, работилници и разговори на общността — на живо и онлайн.",
    cta: { label: "Виж събитията", href: routes.events },
    primary: true,
  },
  {
    title: "Фокус групи",
    text: "Създаваме пространство за споделяне и обмяна на опит.",
    cta: { label: "Научи повече", href: contactPath("Фокус групи") },
    primary: false,
  },
  {
    title: "Индивидуални консултации",
    text: "Лични и онлайн консултации със специалист. Избери направление и удобен свободен час.",
    cta: { label: "Запиши час", href: routes.consultations },
    primary: true,
  },
  {
    title: "Красота и лична грижа",
    text: "Професионални съвети за кожа, коса и нокти, диагностика на кожата, хранителен режим и начин на хранене.",
    cta: { label: "Научи повече", href: routes.beautyClub },
    primary: false,
  },
] as const;
