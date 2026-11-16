import { goals } from "@/content/about";

/**
 * Texts the admin can change under Админ → Текстове на сайта, with the built-in wording as the default.
 * Saved changes live in content_blocks (one row per key); clearing a field brings the default back.
 */
export type EditableText = {
  key: string;
  label: string;
  /** Shown when nothing is saved. An empty default shows the page's own "coming soon" note instead. */
  defaultValue: string;
  multiline?: boolean;
  helperText?: string;
};

export type EditableGroup = { title: string; texts: EditableText[] };

export const editableGroups: EditableGroup[] = [
  {
    title: "Начална страница",
    texts: [
      { key: "home.hero.eyebrow", label: "Надпис над заглавието", defaultValue: "Общност · Подкрепа · Развитие" },
      { key: "home.hero.title", label: "Голямо заглавие", defaultValue: "Заедно\nпо-силни.", multiline: true, helperText: "Нов ред = нов ред на страницата." },
      {
        key: "home.hero.lead",
        label: "Текст под заглавието",
        defaultValue: "Място за подкрепа, споделяне и развитие. Обединяваме жени, които искат да растат, да учат и да създават промяна заедно.",
        multiline: true,
      },
      { key: "home.hero.quote", label: "Цитат в зелената карта", defaultValue: "Жените са по-силни\nкогато са заедно.", multiline: true },
      { key: "home.about.title", label: "„За сдружението“: заглавие", defaultValue: "Общност, която подкрепя и вдъхновява жените." },
      {
        key: "home.about.text",
        label: "„За сдружението“: текст",
        defaultValue:
          "Създаваме пространство за взаимопомощ, професионално и личностно развитие и обмен на опит. Вярваме, че когато жените се подкрепят, се отварят повече възможности за всички.",
        multiline: true,
      },
      {
        key: "home.mission.text",
        label: "„Нашата мисия“",
        defaultValue: "Да изграждаме национална мрежа за взаимопомощ, която насърчава развитието, увереността и активното участие на жените.",
        multiline: true,
      },
      { key: "home.donate.title", label: "Зеленият блок за дарения: заглавие", defaultValue: "Бъди част от промяната." },
      {
        key: "home.donate.text",
        label: "Зеленият блок за дарения: текст",
        defaultValue: "Всяко дарение помага да развиваме инициативи, да създаваме събития и да подкрепяме повече жени.",
        multiline: true,
      },
    ],
  },
  {
    title: "За нас",
    texts: [
      { key: "about.intro.title", label: "Заглавие", defaultValue: "Подкрепа, развитие и взаимопомощ" },
      {
        key: "about.intro.lead",
        label: "Текст под заглавието",
        defaultValue:
          "Обединяваме жени и специалисти, за да създаваме пространство за разбиране, знания, личностно израстване и професионално развитие.",
        multiline: true,
      },
      { key: "about.goals", label: "Нашите цели", defaultValue: goals.join("\n"), multiline: true, helperText: "По една цел на ред." },
    ],
  },
  {
    title: "Контакти",
    texts: [
      { key: "contacts.phone", label: "Телефон за връзка", defaultValue: "", helperText: "Празно = „предстои да бъде предоставен“." },
      {
        key: "contacts.details",
        label: "Имейл и адрес",
        defaultValue: "",
        multiline: true,
        helperText: "Празно = „предстои да бъдат предоставени“.",
      },
    ],
  },
];

export const editableTexts: EditableText[] = editableGroups.flatMap((g) => g.texts);

export type EditableKey = (typeof editableTexts)[number]["key"];
