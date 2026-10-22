import { z } from "zod";

/** Shared form rules with Bulgarian messages. */
export const fullName = z.string().trim().min(2, "Моля, въведи име и фамилия.").max(120, "Името е твърде дълго.");

export const email = z.string().trim().min(1, "Моля, въведи имейл адрес.").pipe(z.email("Моля, въведи валиден имейл адрес."));

/** Bulgarian or international number: digits, spaces, +, -, (). */
export const phone = z
  .string()
  .trim()
  .min(1, "Моля, въведи телефон за връзка.")
  .regex(/^\+?[\d\s()-]{6,20}$/, "Моля, въведи валиден телефонен номер.");

export const consent = z.boolean().refine((value) => value, "Необходимо е съгласие, за да продължиш.");
