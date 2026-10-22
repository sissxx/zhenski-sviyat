import { z } from "zod";
import { localDateTimeToIso } from "./convert";

/**
 * Input checks and row building for a specialist's weekly hours and time off. Shared by the admin panel and
 * the specialist's own schedule page; RLS decides whose schedule each caller may change.
 */

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^(\d{4}-\d{2}-\d{2})?$/;

export const availabilitySchema = z
  .object({
    weekdays: z.array(z.number().int().min(1).max(7)).min(1),
    start: z.string().regex(timePattern),
    end: z.string().regex(timePattern),
    validFrom: z.string().regex(datePattern),
    validUntil: z.string().regex(datePattern),
  })
  .refine((v) => v.end > v.start)
  .refine((v) => !v.validFrom || !v.validUntil || v.validUntil >= v.validFrom);

export type AvailabilityInput = z.infer<typeof availabilitySchema>;

export const availabilityRows = (specialistId: string, { weekdays, start, end, validFrom, validUntil }: AvailabilityInput) =>
  weekdays.map((weekday) => ({
    specialist_id: specialistId,
    weekday,
    start_time: start,
    end_time: end,
    valid_from: validFrom || null,
    valid_until: validUntil || null,
  }));

const dateTimeLocal = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);

export const timeOffSchema = z
  .object({ startsAt: dateTimeLocal, endsAt: dateTimeLocal, reason: z.string().max(300) })
  .refine((v) => v.endsAt > v.startsAt);

export type TimeOffInput = z.infer<typeof timeOffSchema>;

export const timeOffRow = (specialistId: string, { startsAt, endsAt, reason }: TimeOffInput) => ({
  specialist_id: specialistId,
  starts_at: localDateTimeToIso(startsAt),
  ends_at: localDateTimeToIso(endsAt),
  reason: reason.trim() || null,
});
