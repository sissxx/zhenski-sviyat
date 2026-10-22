import { formatDate, formatDateTime, formatPrice, formatTime, sofiaDateKey } from "@/lib/locale";
import type { EmailBlock, EmailContent } from "./layout";

/**
 * Bulgarian text of every transactional email. Each function takes plain data (already loaded from the database)
 * and returns the content for renderEmail(). The Supabase Auth emails (confirm, reset, email change) live in
 * supabase/templates/, built by scripts/build-auth-email-templates.ts.
 */

export type BankInstructions = {
  amountCents: number;
  reference: string | null;
  deadline: string | null;
  beneficiary: string | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
};

/** Bulgarian "с" becomes "със" before с- and з-: "със Силвия", "с Мария". */
const withName = (name: string) => `${/^[сзСЗ]/.test(name.trim()) ? "със" : "с"} ${name}`;

const greeting = (firstName?: string | null) => (firstName?.trim() ? `Здравей, ${firstName.trim()},` : "Здравей,");

/** "15 май 2027 г., 18:30 – 20:00" or "15 май 2027 г. в 18:30" when there is no end on the same day. */
export function formatWhen(startsAt: string, endsAt?: string | null): string {
  if (endsAt && sofiaDateKey(startsAt) === sofiaDateKey(endsAt)) {
    return `${formatDate(startsAt)}, ${formatTime(startsAt)} – ${formatTime(endsAt)}`;
  }
  if (endsAt) return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
  return formatDateTime(startsAt);
}

function bankBlocks(bank: BankInstructions, subject: "мястото" | "часът"): EmailBlock[] {
  return [
    {
      kind: "details",
      title: "Данни за банков превод",
      rows: [
        { label: "Сума", value: formatPrice(bank.amountCents) },
        { label: "Основание", value: bank.reference, mono: true },
        { label: "Получател", value: bank.beneficiary },
        { label: "IBAN", value: bank.iban, mono: true },
        { label: "BIC", value: bank.bic, mono: true },
        { label: "Банка", value: bank.bankName },
        { label: "Срок за плащане", value: bank.deadline ? formatDateTime(bank.deadline) : null },
      ],
    },
    bank.iban
      ? {
          kind: "callout",
          text: `Напиши основанието точно както е показано, за да свържем превода със заявката ти. Ако преводът не пристигне до крайния срок, ${subject} се освобождава.`,
        }
      : {
          kind: "callout",
          text: "Банковата сметка на сдружението ще ти изпратим отделно. Ако имаш въпроси, просто отговори на този имейл.",
        },
    { kind: "text", text: "Ще ти пишем отново, щом потвърдим плащането." },
  ];
}

// --- Events -----------------------------------------------------------------------------------------------

export type EventRegistrationData = {
  firstName: string | null;
  eventTitle: string;
  startsAt: string;
  endsAt: string | null;
  place: string | null;
  eventUrl: string;
  accountUrl: string;
  /** Only for confirmed registrations. */
  onlineUrl?: string | null;
  attendeeInstructions?: string | null;
};

function eventDetails(data: EventRegistrationData): EmailBlock {
  return {
    kind: "details",
    rows: [
      { label: "Събитие", value: data.eventTitle },
      { label: "Кога", value: formatWhen(data.startsAt, data.endsAt) },
      { label: "Къде", value: data.place },
    ],
  };
}

function attendeeBlocks(data: Pick<EventRegistrationData, "onlineUrl" | "attendeeInstructions">): EmailBlock[] {
  return [
    ...(data.onlineUrl ? [{ kind: "button", label: "Връзка за включване", url: data.onlineUrl } as const] : []),
    ...(data.attendeeInstructions ? [{ kind: "callout", text: data.attendeeInstructions } as const] : []),
  ];
}

export function eventRegistrationConfirmed(data: EventRegistrationData): EmailContent {
  return {
    subject: `Записа се за „${data.eventTitle}“`,
    preheader: `Мястото ти е запазено: ${formatWhen(data.startsAt, data.endsAt)}.`,
    heading: "Мястото ти е запазено",
    greeting: greeting(data.firstName),
    blocks: [
      { kind: "text", text: "Благодарим ти, че се записа! Очакваме те." },
      eventDetails(data),
      ...attendeeBlocks(data),
      { kind: "button", label: "Виж събитието", url: data.eventUrl },
      { kind: "note", text: `Записванията си можеш да видиш и откажеш в профила си: ${data.accountUrl}` },
    ],
  };
}

export function eventRegistrationPendingPayment(data: EventRegistrationData & { bank: BankInstructions }): EmailContent {
  return {
    subject: `Заявка за „${data.eventTitle}“: данни за плащане`,
    preheader: `Преведи ${formatPrice(data.bank.amountCents)} с основание ${data.bank.reference ?? ""}, за да потвърдим мястото ти.`,
    heading: "Запазихме ти място",
    greeting: greeting(data.firstName),
    blocks: [
      {
        kind: "text",
        text: "Благодарим ти за заявката! Мястото ти е запазено временно. Ще го потвърдим, щом получим банковия превод.",
      },
      eventDetails(data),
      ...bankBlocks(data.bank, "мястото"),
      { kind: "button", label: "Моите събития", url: data.accountUrl },
    ],
  };
}

// --- Payments ---------------------------------------------------------------------------------------------

export type PaymentConfirmedData = {
  firstName: string | null;
  amountCents: number;
  paidAt: string | null;
  /** What the payment was for, e.g. "Събитие „Пролетна среща“". */
  purpose: string;
  /** Extra rows, e.g. date of the event or the membership period. */
  rows: { label: string; value: string | null }[];
  method: "bank_transfer" | "stripe";
  url: string;
  urlLabel: string;
  onlineUrl?: string | null;
  attendeeInstructions?: string | null;
};

export function paymentConfirmed(data: PaymentConfirmedData): EmailContent {
  return {
    subject: `Плащането е потвърдено: ${data.purpose}`,
    preheader: `Получихме ${formatPrice(data.amountCents)}. Благодарим ти!`,
    heading: "Плащането е потвърдено",
    greeting: greeting(data.firstName),
    blocks: [
      {
        kind: "text",
        text:
          data.method === "bank_transfer"
            ? "Получихме банковия ти превод. Благодарим ти! Всичко е потвърдено."
            : "Получихме плащането ти. Благодарим ти! Всичко е потвърдено.",
      },
      {
        kind: "details",
        rows: [
          { label: "За", value: data.purpose },
          ...data.rows,
          { label: "Сума", value: formatPrice(data.amountCents) },
          { label: "Платено на", value: data.paidAt ? formatDate(data.paidAt) : null },
          { label: "Начин", value: data.method === "bank_transfer" ? "Банков превод" : "Карта" },
        ],
      },
      ...attendeeBlocks(data),
      { kind: "button", label: data.urlLabel, url: data.url },
    ],
  };
}

// --- Consultations ----------------------------------------------------------------------------------------

export type ConsultationData = {
  firstName: string | null;
  serviceName: string;
  specialistName: string;
  startsAt: string;
  endsAt: string;
  locationInfo: string | null;
  priceCents: number;
  accountUrl: string;
};

function consultationDetails(data: ConsultationData, extra: { label: string; value: string | null }[] = []): EmailBlock {
  return {
    kind: "details",
    rows: [
      { label: "Консултация", value: data.serviceName },
      { label: "Специалист", value: data.specialistName },
      { label: "Кога", value: formatWhen(data.startsAt, data.endsAt) },
      ...extra,
      { label: "Къде", value: data.locationInfo },
      { label: "Цена", value: data.priceCents > 0 ? formatPrice(data.priceCents) : "Безплатно" },
    ],
  };
}

export function consultationBooked(data: ConsultationData & { cancelDeadlineHours: number | null }): EmailContent {
  return {
    subject: `Часът ти е запазен: ${formatDateTime(data.startsAt)}`,
    preheader: `${data.serviceName} ${withName(data.specialistName)}.`,
    heading: "Часът ти е запазен",
    greeting: greeting(data.firstName),
    blocks: [
      { kind: "text", text: "Благодарим ти! Ето подробностите за консултацията." },
      consultationDetails(data),
      ...(data.cancelDeadlineHours
        ? [
            {
              kind: "note",
              text: `Можеш да откажеш или преместиш часа от профила си до ${data.cancelDeadlineHours} ч. преди началото.`,
            } as const,
          ]
        : []),
      { kind: "button", label: "Моите консултации", url: data.accountUrl },
    ],
  };
}

export function consultationPendingPayment(data: ConsultationData & { bank: BankInstructions }): EmailContent {
  return {
    subject: `Заявка за консултация: данни за плащане`,
    preheader: `Преведи ${formatPrice(data.bank.amountCents)}, за да потвърдим часа ти.`,
    heading: "Запазихме ти час",
    greeting: greeting(data.firstName),
    blocks: [
      {
        kind: "text",
        text: "Благодарим ти за заявката! Часът е запазен временно. Ще го потвърдим, щом получим банковия превод.",
      },
      consultationDetails(data),
      ...bankBlocks(data.bank, "часът"),
      { kind: "button", label: "Моите консултации", url: data.accountUrl },
    ],
  };
}

export function consultationCancelled(data: ConsultationData & { reason: string | null; byClient: boolean; bookUrl: string }): EmailContent {
  return {
    subject: `Консултацията на ${formatDate(data.startsAt)} е отменена`,
    preheader: `${data.serviceName} ${withName(data.specialistName)}, ${formatDateTime(data.startsAt)}.`,
    heading: "Консултацията е отменена",
    greeting: greeting(data.firstName),
    blocks: [
      {
        kind: "text",
        text: data.byClient
          ? "Отменихме часа ти, както поиска."
          : "Съжаляваме, но се наложи да отменим часа ти. Ако вече има направено плащане, ще се свържем с теб за връщането му.",
      },
      consultationDetails(data, [{ label: "Причина", value: data.byClient ? null : data.reason }]),
      { kind: "text", text: "Ще се радваме да запазиш нов час, когато ти е удобно." },
      { kind: "button", label: "Запази нов час", url: data.bookUrl },
    ],
  };
}

export function consultationRescheduled(data: ConsultationData & { previousStartsAt: string }): EmailContent {
  return {
    subject: `Консултацията е преместена: ${formatDateTime(data.startsAt)}`,
    preheader: `Новият час е ${formatDateTime(data.startsAt)}.`,
    heading: "Часът ти е преместен",
    greeting: greeting(data.firstName),
    blocks: [
      { kind: "text", text: "Преместихме консултацията ти. Ето новия час." },
      consultationDetails(data, [{ label: "Предишен час", value: formatDateTime(data.previousStartsAt) }]),
      { kind: "button", label: "Моите консултации", url: data.accountUrl },
    ],
  };
}

// --- To the specialist ------------------------------------------------------------------------------------

export type SpecialistNoticeData = {
  specialistFirstName: string | null;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  note: string | null;
  /** True while the client still has to pay by bank transfer. */
  awaitingPayment: boolean;
  scheduleUrl: string;
};

function specialistDetails(data: SpecialistNoticeData, extra: { label: string; value: string | null }[] = []): EmailBlock {
  return {
    kind: "details",
    rows: [
      { label: "Клиент", value: data.clientName },
      { label: "Имейл", value: data.clientEmail },
      { label: "Телефон", value: data.clientPhone },
      { label: "Консултация", value: data.serviceName },
      { label: "Кога", value: formatWhen(data.startsAt, data.endsAt) },
      ...extra,
      { label: "Бележка", value: data.note },
    ],
  };
}

export function specialistBookingCreated(data: SpecialistNoticeData): EmailContent {
  return {
    subject: `Нов час: ${data.clientName}, ${formatDateTime(data.startsAt)}`,
    preheader: `${data.serviceName}, ${formatWhen(data.startsAt, data.endsAt)}.`,
    heading: "Имаш нов запазен час",
    greeting: greeting(data.specialistFirstName),
    blocks: [
      specialistDetails(data),
      ...(data.awaitingPayment
        ? [{ kind: "callout", text: "Клиентът плаща с банков превод. Часът ще бъде потвърден, щом преводът пристигне." } as const]
        : []),
      { kind: "button", label: "Моят график", url: data.scheduleUrl },
    ],
  };
}

export function specialistBookingCancelled(data: SpecialistNoticeData & { reason: string | null }): EmailContent {
  return {
    subject: `Отменен час: ${data.clientName}, ${formatDateTime(data.startsAt)}`,
    preheader: `${data.serviceName}, ${formatWhen(data.startsAt, data.endsAt)}. Часът е свободен отново.`,
    heading: "Час е отменен",
    greeting: greeting(data.specialistFirstName),
    blocks: [
      { kind: "text", text: "Този час е отменен и вече е свободен за други записвания." },
      specialistDetails(data, [{ label: "Причина", value: data.reason }]),
      { kind: "button", label: "Моят график", url: data.scheduleUrl },
    ],
  };
}

export function specialistBookingRescheduled(data: SpecialistNoticeData & { previousStartsAt: string }): EmailContent {
  return {
    subject: `Преместен час: ${data.clientName}, ${formatDateTime(data.startsAt)}`,
    preheader: `Нов час: ${formatWhen(data.startsAt, data.endsAt)}.`,
    heading: "Час е преместен",
    greeting: greeting(data.specialistFirstName),
    blocks: [
      specialistDetails(data, [{ label: "Предишен час", value: formatDateTime(data.previousStartsAt) }]),
      { kind: "button", label: "Моят график", url: data.scheduleUrl },
    ],
  };
}
