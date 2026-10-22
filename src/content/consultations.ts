import { formatTime, formatWeekdayDayMonth, sofiaDateKey, sofiaWallTimeToUtc } from "@/lib/locale";

/**
 * Mock consultation catalogue and weekly availability, shaped like the
 * `consultation_types`, `specialists` and `specialist_availability` tables.
 * Replaced by Supabase data once it is set up. Prices, durations and hours are
 * placeholders; booking window and cancellation rules will be admin settings.
 */

export type ConsultationFormat = "in_person" | "online";

export const consultationFormats: Record<ConsultationFormat, string> = {
  online: "Онлайн",
  in_person: "На живо · София",
};

export type ConsultationType = {
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  formats: ConsultationFormat[];
  specialistIds: string[];
};

export type Specialist = { id: string; name: string; title: string };

export const specialists: Specialist[] = [
  { id: "liliya-galabova", name: "Лили Гълъбова – Божикова", title: "Психолог" },
  { id: "magdalina-pencheva", name: "Магдалина Пенчева", title: "Психолог" },
  { id: "olya-dimitrova", name: "Оля Димитрова", title: "Психолог" },
  { id: "irena-stancheva", name: "адв. Ирена Станчева", title: "Адвокат" },
  { id: "tsvetelina-slavcheva", name: "адв. Цветелина Славчева", title: "Адвокат и медиатор" },
  { id: "rumyana-petrova", name: "Румяна Петрова", title: "Специалист здравни грижи" },
];

export const consultationTypes: ConsultationType[] = [
  {
    slug: "psihologicheska-podkrepa",
    name: "Психологическа подкрепа",
    description: "Изслушване, разбиране и подкрепа в труден момент.",
    durationMinutes: 50,
    priceCents: 4000,
    formats: ["online", "in_person"],
    specialistIds: ["liliya-galabova", "magdalina-pencheva", "olya-dimitrova"],
  },
  {
    slug: "yuridicheska-konsultatsiya",
    name: "Юридическа консултация",
    description: "Насоки по конкретен казус: семейно, трудово или договорно право.",
    durationMinutes: 45,
    priceCents: 5000,
    formats: ["online", "in_person"],
    specialistIds: ["irena-stancheva", "tsvetelina-slavcheva"],
  },
  {
    slug: "lichnostno-i-karierno-razvitie",
    name: "Личностно и кариерно развитие",
    description: "Самооценка, лични граници и следващата стъпка в кариерата.",
    durationMinutes: 50,
    priceCents: 4000,
    formats: ["online"],
    specialistIds: ["magdalina-pencheva", "olya-dimitrova"],
  },
  {
    slug: "upravlenie-na-stresa",
    name: "Управление на стреса",
    description: "Техники и навици за справяне със стреса.",
    durationMinutes: 50,
    priceCents: 4000,
    formats: ["online"],
    specialistIds: ["liliya-galabova"],
  },
  {
    slug: "zdravna-grizha",
    name: "Здравна грижа",
    description: "Хранене, тонус и лично самочувствие.",
    durationMinutes: 40,
    priceCents: 3000,
    formats: ["in_person", "online"],
    specialistIds: ["rumyana-petrova"],
  },
];

/** Weekly hours per specialist, Sofia time. ISO weekdays: 1 = Monday … 7 = Sunday. */
const weeklyHours: Record<string, { weekday: number; times: string[] }[]> = {
  "liliya-galabova": [
    { weekday: 1, times: ["10:00", "11:00", "17:00"] },
    { weekday: 3, times: ["17:00", "18:00"] },
  ],
  "magdalina-pencheva": [
    { weekday: 2, times: ["09:00", "10:00", "11:00"] },
    { weekday: 4, times: ["16:00", "17:00"] },
  ],
  "olya-dimitrova": [
    { weekday: 3, times: ["10:00", "11:00"] },
    { weekday: 5, times: ["14:00", "15:00", "16:00"] },
  ],
  "irena-stancheva": [{ weekday: 2, times: ["14:00", "15:00", "16:00"] }],
  "tsvetelina-slavcheva": [{ weekday: 4, times: ["10:00", "11:00", "12:00"] }],
  "rumyana-petrova": [
    { weekday: 1, times: ["15:00", "16:00"] },
    { weekday: 5, times: ["10:00", "11:00"] },
  ],
};

export type ConsultationSlot = {
  /** UTC ISO start time. */
  startsAt: string;
  specialistId: string;
  dateKey: string;
  dayLabel: string;
  timeLabel: string;
  taken: boolean;
};

const BOOKING_WINDOW_DAYS = 21;
/** Earliest bookable start, so specialists get notice. */
const MIN_NOTICE_HOURS = 24;

/** Stable pseudo-random "already booked" flag so the mock calendar shows taken slots. */
const looksTaken = (key: string) => [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4 === 0;

/** Bookable slots for the next three weeks, with labels formatted in Sofia time. */
export function buildConsultationSlots(now = new Date()): ConsultationSlot[] {
  const slots: ConsultationSlot[] = [];
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 3600_000;
  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset += 1) {
    const day = new Date(now.getTime() + offset * 86_400_000);
    const dateKey = sofiaDateKey(day);
    const weekday = ((new Date(`${dateKey}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
    for (const [specialistId, rules] of Object.entries(weeklyHours)) {
      for (const rule of rules.filter((r) => r.weekday === weekday)) {
        for (const time of rule.times) {
          const start = sofiaWallTimeToUtc(dateKey, time);
          if (start.getTime() < earliest) continue;
          slots.push({
            startsAt: start.toISOString(),
            specialistId,
            dateKey,
            dayLabel: formatWeekdayDayMonth(start),
            timeLabel: formatTime(start),
            taken: looksTaken(`${specialistId}${dateKey}${time}`),
          });
        }
      }
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
