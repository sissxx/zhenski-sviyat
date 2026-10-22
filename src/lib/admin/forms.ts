import { z } from "zod";

/**
 * Admin form definitions: the fields each editor shows and the Zod schema that checks them, in the browser
 * and again in the server action. Values stay strings and booleans here; src/lib/admin/entities.ts turns them
 * into database rows.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "slug"
  | "number"
  | "money"
  | "datetime"
  | "date"
  | "checkbox"
  | "select"
  | "image"
  | "lines"
  | "email"
  | "url";

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  helperText?: string;
  options?: { value: string; label: string }[];
  /** Grid columns out of 6 on wide screens. Defaults to 6 (full width), 3 for short fields. */
  span?: 2 | 3 | 6;
  /** For slug fields: the field whose text suggests the slug. */
  slugFrom?: string;
  /** For image fields: folder in the media bucket. */
  folder?: string;
};

export type FormSection = { title?: string; description?: string; fields: FieldConfig[] };

type Values = Record<string, unknown>;

export type EntityForm = { schema: z.ZodType<Values, Values>; sections: FormSection[] };

// --- Field rules ------------------------------------------------------------------------------------------

const required = "Задължително поле.";
const reqText = (max = 300) => z.string().trim().min(1, required).max(max, `До ${max} знака.`);
const optText = (max = 20000) => z.string().max(max, `До ${max} знака.`);
const slug = z
  .string()
  .trim()
  .min(1, required)
  .max(80, "До 80 знака.")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Само малки латински букви, цифри и тирета, напр. zhenska-sila.");
const moneyPattern = /^\d{1,6}([.,]\d{1,2})?$/;
const money = z.string().trim().regex(moneyPattern, "Въведи сума в евро, напр. 20 или 20,50.");
const optMoney = z.string().trim().refine((v) => v === "" || moneyPattern.test(v), "Въведи сума в евро, напр. 20 или 20,50.");
const intIn = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Въведи цяло число.")
    .refine((v) => Number(v) >= min && Number(v) <= max, `Между ${min} и ${max}.`);
const optIntIn = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `Цяло число между ${min} и ${max}.`);
const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const dateTime = z.string().regex(dateTimePattern, "Избери дата и час.");
const optDateTime = z.string().refine((v) => v === "" || dateTimePattern.test(v), "Избери дата и час.");
const optUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Адресът трябва да започва с https://");
const optEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Невалиден имейл адрес.");
const bool = z.boolean();
const sortOrder = optIntIn(0, 9999);

const later = (a: string, b: string) => a === "" || b === "" || b > a;

// --- Shared field configs ---------------------------------------------------------------------------------

const publishedField = (label = "Публикувано на сайта"): FieldConfig => ({ name: "is_published", label, type: "checkbox" });
const activeField = (label: string): FieldConfig => ({ name: "is_active", label, type: "checkbox" });
const sortField: FieldConfig = {
  name: "sort_order",
  label: "Подредба",
  type: "number",
  span: 2,
  helperText: "По-малкото число е по-напред.",
};
const slugField = (from: string, helperText = "Част от адреса на страницата. Не го сменяй след публикуване."): FieldConfig => ({
  name: "slug",
  label: "Адрес (slug)",
  type: "slug",
  slugFrom: from,
  span: 3,
  helperText,
});

// --- Entities ---------------------------------------------------------------------------------------------

export const eventStatusLabels = {
  draft: "Чернова",
  published: "Публикувано",
  cancelled: "Отменено",
  completed: "Приключило",
} as const;

export const eventFormatLabels = { in_person: "На живо", online: "Онлайн", hybrid: "На живо и онлайн" } as const;

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const eventForm: EntityForm = {
  schema: z
    .object({
      title: reqText(200),
      slug,
      summary: optText(400),
      description: optText(),
      status: z.enum(["draft", "published", "cancelled", "completed"]),
      format: z.enum(["in_person", "online", "hybrid"]),
      is_featured: bool,
      starts_at: dateTime,
      ends_at: optDateTime,
      venue_name: optText(200),
      venue_address: optText(300),
      city: optText(100),
      price: money,
      capacity: optIntIn(1, 100000),
      allow_bank_transfer: bool,
      registration_opens_at: optDateTime,
      registration_deadline: optDateTime,
      cancellation_deadline_hours: optIntIn(0, 8760),
      cover_image_path: optText(500),
      online_url: optUrl,
      attendee_instructions: optText(4000),
    })
    .superRefine((v, ctx) => {
      if (!later(v.starts_at, v.ends_at)) ctx.addIssue({ code: "custom", path: ["ends_at"], message: "Краят трябва да е след началото." });
      if (!later(v.registration_opens_at, v.registration_deadline))
        ctx.addIssue({ code: "custom", path: ["registration_deadline"], message: "Крайният срок трябва да е след отварянето." });
    }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "title", label: "Заглавие", type: "text" },
        slugField("title"),
        { name: "status", label: "Статус", type: "select", options: toOptions(eventStatusLabels), span: 3, helperText: "Черновите не се виждат на сайта." },
        { name: "summary", label: "Кратко описание", type: "textarea", helperText: "Показва се в картата на събитието." },
        { name: "description", label: "Подробно описание", type: "textarea" },
        { name: "cover_image_path", label: "Снимка", type: "image", folder: "events" },
        { name: "is_featured", label: "Показвай на началната страница", type: "checkbox" },
      ],
    },
    {
      title: "Дата и място",
      fields: [
        { name: "starts_at", label: "Начало", type: "datetime", span: 3 },
        { name: "ends_at", label: "Край (по избор)", type: "datetime", span: 3 },
        { name: "format", label: "Формат", type: "select", options: toOptions(eventFormatLabels), span: 2 },
        { name: "city", label: "Град", type: "text", span: 2 },
        { name: "venue_name", label: "Място", type: "text", span: 2, helperText: "Напр. „Зала Европа“." },
        { name: "venue_address", label: "Адрес", type: "text" },
      ],
    },
    {
      title: "Цена и записване",
      fields: [
        { name: "price", label: "Цена (€)", type: "money", span: 2, helperText: "0 за безплатно събитие." },
        { name: "capacity", label: "Места", type: "number", span: 2, helperText: "Празно = без ограничение." },
        {
          name: "cancellation_deadline_hours",
          label: "Отказ до (часа преди)",
          type: "number",
          span: 2,
          helperText: "Празно = общата настройка.",
        },
        { name: "registration_opens_at", label: "Записването започва", type: "datetime", span: 3, helperText: "Празно = веднага." },
        { name: "registration_deadline", label: "Краен срок за записване", type: "datetime", span: 3, helperText: "Празно = до началото." },
        { name: "allow_bank_transfer", label: "Разреши плащане по банков път", type: "checkbox" },
      ],
    },
    {
      title: "Само за записалите се",
      description: "Виждат го само участничките с потвърдено записване.",
      fields: [
        { name: "online_url", label: "Линк за онлайн участие", type: "url" },
        { name: "attendee_instructions", label: "Указания за участничките", type: "textarea" },
      ],
    },
  ],
};

export const consultationTypeForm: EntityForm = {
  schema: z.object({
    name: reqText(200),
    slug,
    description: optText(),
    duration_minutes: intIn(10, 480),
    buffer_minutes: intIn(0, 120),
    price: money,
    requires_prepayment: bool,
    allow_bank_transfer: bool,
    location_info: optText(1000),
    is_active: bool,
    sort_order: sortOrder,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "name", label: "Име", type: "text" },
        slugField("name"),
        sortField,
        { name: "description", label: "Описание", type: "textarea" },
        { name: "duration_minutes", label: "Продължителност (мин.)", type: "number", span: 2 },
        { name: "buffer_minutes", label: "Почивка след нея (мин.)", type: "number", span: 2 },
        { name: "price", label: "Цена (€)", type: "money", span: 2, helperText: "0 за безплатна." },
        { name: "location_info", label: "Къде се провежда", type: "textarea", helperText: "Напр. онлайн линк или адрес." },
        { name: "requires_prepayment", label: "Плаща се предварително (иначе — на място)", type: "checkbox" },
        { name: "allow_bank_transfer", label: "Разреши плащане по банков път", type: "checkbox" },
        activeField("Активна (може да се запазва)"),
      ],
    },
  ],
};

export const specialistForm: EntityForm = {
  schema: z.object({
    full_name: reqText(200),
    slug,
    title: optText(200),
    bio: optText(),
    photo_path: optText(500),
    is_active: bool,
    sort_order: sortOrder,
    login_email: optEmail,
    notification_email: optEmail,
    phone: optText(40),
    internal_note: optText(2000),
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "full_name", label: "Име и фамилия", type: "text" },
        slugField("full_name"),
        sortField,
        { name: "title", label: "Професия / специалност", type: "text" },
        { name: "bio", label: "Представяне", type: "textarea" },
        { name: "photo_path", label: "Снимка", type: "image", folder: "specialists" },
        activeField("Показвай на сайта и приемай записвания"),
      ],
    },
    {
      title: "Вътрешни данни",
      description: "Не се показват на сайта.",
      fields: [
        {
          name: "login_email",
          label: "Профил за вход (имейл)",
          type: "email",
          helperText: "Ако специалистът има профил на сайта, тя ще вижда своя график и записванията си.",
        },
        { name: "notification_email", label: "Имейл за известия", type: "email", span: 3 },
        { name: "phone", label: "Телефон", type: "text", span: 3 },
        { name: "internal_note", label: "Бележка", type: "textarea" },
      ],
    },
  ],
};

export const billingIntervalLabels = { month: "Месечно", year: "Годишно" } as const;

export const planForm: EntityForm = {
  schema: z.object({
    name: reqText(200),
    slug,
    description: optText(),
    features: optText(4000),
    price: money.refine((v) => Number(v.replace(",", ".")) > 0, "Цената трябва да е над 0."),
    billing_interval: z.enum(["month", "year"]),
    stripe_price_id: z
      .string()
      .trim()
      .refine((v) => v === "" || /^price_\w+$/.test(v), "Започва с price_."),
    allow_bank_transfer: bool,
    is_active: bool,
    sort_order: sortOrder,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "name", label: "Име", type: "text" },
        slugField("name"),
        sortField,
        { name: "description", label: "Описание", type: "textarea" },
        { name: "features", label: "Какво включва", type: "lines", helperText: "По едно на ред." },
        { name: "price", label: "Цена (€)", type: "money", span: 2 },
        { name: "billing_interval", label: "Плащане", type: "select", options: toOptions(billingIntervalLabels), span: 2 },
        {
          name: "stripe_price_id",
          label: "Stripe Price ID",
          type: "text",
          span: 2,
          helperText: "При нова цена създай нова цена в Stripe и я сложи тук.",
        },
        { name: "allow_bank_transfer", label: "Разреши плащане по банков път", type: "checkbox" },
        activeField("Активен (предлага се на сайта)"),
      ],
    },
  ],
};

export const viberGroupForm: EntityForm = {
  schema: z.object({
    name: reqText(200),
    slug,
    description: optText(2000),
    invite_link: optUrl,
    join_instructions: optText(2000),
    is_active: bool,
    sort_order: sortOrder,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "name", label: "Име", type: "text" },
        slugField("name", "Вътрешен ключ на групата."),
        sortField,
        { name: "description", label: "Описание", type: "textarea" },
        activeField("Активна"),
      ],
    },
    {
      title: "Достъп",
      description: "Виждат го само членовете с активен абонамент за план, който включва групата.",
      fields: [
        { name: "invite_link", label: "Линк за покана", type: "url" },
        { name: "join_instructions", label: "Указания за присъединяване", type: "textarea" },
      ],
    },
  ],
};

export const faqForm: EntityForm = {
  schema: z.object({
    question: reqText(500),
    answer: reqText(5000),
    category: optText(100),
    sort_order: sortOrder,
    is_published: bool,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "question", label: "Въпрос", type: "text" },
        { name: "answer", label: "Отговор", type: "textarea" },
        { name: "category", label: "Категория (по избор)", type: "text", span: 3 },
        sortField,
        publishedField(),
      ],
    },
  ],
};

export const partnerKindLabels = { partner: "Партньор", supporter: "Подкрепа", sponsor: "Спонсор", media: "Медиен партньор" } as const;

export const partnerForm: EntityForm = {
  schema: z.object({
    name: reqText(200),
    kind: z.enum(["partner", "supporter", "sponsor", "media"]),
    description: optText(2000),
    logo_path: optText(500),
    website_url: optUrl,
    sort_order: sortOrder,
    is_published: bool,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "name", label: "Име", type: "text" },
        { name: "kind", label: "Вид", type: "select", options: toOptions(partnerKindLabels), span: 3 },
        sortField,
        { name: "description", label: "Описание", type: "textarea" },
        { name: "website_url", label: "Уебсайт", type: "url" },
        { name: "logo_path", label: "Лого", type: "image", folder: "partners" },
        publishedField(),
      ],
    },
  ],
};

export const promotionForm: EntityForm = {
  schema: z
    .object({
      title: reqText(200),
      slug,
      description: optText(4000),
      price: optMoney,
      original_price: optMoney,
      valid_from: optDateTime,
      valid_until: optDateTime,
      cta_label: optText(60),
      cta_url: z.string().trim().max(500),
      image_path: optText(500),
      sort_order: sortOrder,
      is_published: bool,
    })
    .superRefine((v, ctx) => {
      if (!later(v.valid_from, v.valid_until))
        ctx.addIssue({ code: "custom", path: ["valid_until"], message: "Краят трябва да е след началото." });
    }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "title", label: "Заглавие", type: "text" },
        slugField("title", "Вътрешен ключ на промоцията."),
        sortField,
        { name: "description", label: "Описание", type: "textarea" },
        { name: "price", label: "Цена (€)", type: "money", span: 3, helperText: "Празно = без цена." },
        { name: "original_price", label: "Стара цена (€)", type: "money", span: 3, helperText: "Показва се зачеркната." },
        { name: "valid_from", label: "Валидна от", type: "datetime", span: 3 },
        { name: "valid_until", label: "Валидна до", type: "datetime", span: 3, helperText: "След тази дата се скрива." },
        { name: "cta_label", label: "Текст на бутона", type: "text", span: 3 },
        { name: "cta_url", label: "Линк на бутона", type: "text", span: 3, helperText: "Напр. /kontakti или https://…" },
        { name: "image_path", label: "Снимка", type: "image", folder: "promotions" },
        publishedField(),
      ],
    },
  ],
};

export const teamGroupLabels = { founder: "Учредител", team: "Екип", ambassador: "Посланик" } as const;

export const teamMemberForm: EntityForm = {
  schema: z.object({
    full_name: reqText(200),
    slug,
    role_title: optText(200),
    bio: optText(),
    photo_path: optText(500),
    member_group: z.enum(["founder", "team", "ambassador"]),
    sort_order: sortOrder,
    is_published: bool,
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "full_name", label: "Име и фамилия", type: "text" },
        slugField("full_name"),
        { name: "member_group", label: "Група", type: "select", options: toOptions(teamGroupLabels), span: 2 },
        { name: "role_title", label: "Роля", type: "text" },
        { name: "bio", label: "Представяне", type: "textarea" },
        { name: "photo_path", label: "Снимка", type: "image", folder: "team" },
        sortField,
        publishedField(),
      ],
    },
  ],
};

export const announcementForm: EntityForm = {
  schema: z
    .object({
      title: reqText(200),
      body: optText(4000),
      link_url: z.string().trim().max(500),
      image_path: optText(500),
      starts_at: optDateTime,
      ends_at: optDateTime,
      is_published: bool,
    })
    .superRefine((v, ctx) => {
      if (!later(v.starts_at, v.ends_at)) ctx.addIssue({ code: "custom", path: ["ends_at"], message: "Краят трябва да е след началото." });
    }) as unknown as EntityForm["schema"],
  sections: [
    {
      fields: [
        { name: "title", label: "Заглавие", type: "text" },
        { name: "body", label: "Текст", type: "textarea" },
        { name: "link_url", label: "Линк (по избор)", type: "text", helperText: "Напр. /sabitiya или https://…" },
        { name: "image_path", label: "Снимка", type: "image", folder: "announcements" },
        { name: "starts_at", label: "Показвай от", type: "datetime", span: 3 },
        { name: "ends_at", label: "Показвай до", type: "datetime", span: 3 },
        publishedField(),
      ],
    },
  ],
};

export const settingsForm: EntityForm = {
  schema: z.object({
    consultation_max_advance_days: intIn(1, 365),
    consultation_min_notice_hours: intIn(0, 720),
    consultation_cancel_deadline_hours: intIn(0, 720),
    consultation_max_reschedules: intIn(0, 20),
    consultation_slot_step_minutes: intIn(5, 240),
    event_cancel_deadline_hours: intIn(0, 8760),
    checkout_hold_minutes: intIn(30, 1440),
    bank_transfer_hold_days: intIn(1, 30),
    subscriptions_allow_bank_transfer: bool,
    subscription_renewal_window_days: intIn(1, 60),
    subscription_past_due_grace_days: intIn(0, 60),
    bank_transfer_beneficiary: optText(200),
    bank_transfer_iban: z
      .string()
      .trim()
      .refine((v) => v === "" || /^[A-Z]{2}\d{2}[A-Z0-9 ]{10,40}$/.test(v.toUpperCase()), "Невалиден IBAN."),
    bank_transfer_bic: optText(20),
    bank_transfer_bank_name: optText(200),
  }) as unknown as EntityForm["schema"],
  sections: [
    {
      title: "Консултации",
      fields: [
        { name: "consultation_max_advance_days", label: "Записване до (дни напред)", type: "number", span: 3 },
        { name: "consultation_min_notice_hours", label: "Най-рано (часа от сега)", type: "number", span: 3 },
        { name: "consultation_cancel_deadline_hours", label: "Отказ / промяна до (часа преди)", type: "number", span: 3 },
        { name: "consultation_max_reschedules", label: "Брой промени на час", type: "number", span: 3 },
        {
          name: "consultation_slot_step_minutes",
          label: "Стъпка между началните часове (мин.)",
          type: "number",
          span: 3,
        },
      ],
    },
    {
      title: "Събития",
      fields: [
        {
          name: "event_cancel_deadline_hours",
          label: "Отказ до (часа преди началото)",
          type: "number",
          span: 3,
          helperText: "Всяко събитие може да има собствен срок.",
        },
      ],
    },
    {
      title: "Плащания и абонаменти",
      fields: [
        { name: "checkout_hold_minutes", label: "Задържане на място при плащане с карта (мин.)", type: "number", span: 3, helperText: "Минимум 30." },
        { name: "bank_transfer_hold_days", label: "Изчакване на банков превод (дни)", type: "number", span: 3 },
        { name: "subscription_renewal_window_days", label: "Подновяване по банков път — от колко дни преди края", type: "number", span: 3 },
        { name: "subscription_past_due_grace_days", label: "Гратисен период при неуспешно плащане с карта (дни)", type: "number", span: 3 },
        { name: "subscriptions_allow_bank_transfer", label: "Абонаменти по банков път", type: "checkbox" },
      ],
    },
    {
      title: "Банкова сметка",
      description: "Показва се в указанията за плащане по банков път.",
      fields: [
        { name: "bank_transfer_beneficiary", label: "Получател", type: "text", span: 3 },
        { name: "bank_transfer_bank_name", label: "Банка", type: "text", span: 3 },
        { name: "bank_transfer_iban", label: "IBAN", type: "text", span: 3 },
        { name: "bank_transfer_bic", label: "BIC", type: "text", span: 3 },
      ],
    },
  ],
};

export const entityForms = {
  event: eventForm,
  consultationType: consultationTypeForm,
  specialist: specialistForm,
  plan: planForm,
  viberGroup: viberGroupForm,
  faq: faqForm,
  partner: partnerForm,
  promotion: promotionForm,
  teamMember: teamMemberForm,
  announcement: announcementForm,
  settings: settingsForm,
} satisfies Record<string, EntityForm>;

export type EntityKey = keyof typeof entityForms;
