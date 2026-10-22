import { z } from "zod";
import { consent, email } from "@/lib/validation";

/** Form schemas for the account pages. Used by the forms and again by the server actions. */

const password = z
  .string()
  .min(8, "Паролата трябва да е поне 8 знака.")
  .max(72, "Паролата е твърде дълга.")
  .regex(/[A-Za-zА-Яа-я]/, "Паролата трябва да съдържа поне една буква.")
  .regex(/\d/, "Паролата трябва да съдържа поне една цифра.");

const personName = (missing: string) =>
  z.string().trim().min(1, missing).max(100, "Твърде дълго е.");

const optionalPhone = z
  .string()
  .trim()
  .regex(/^(\+?[\d\s()-]{6,20})?$/, "Моля, въведи валиден телефонен номер.");

export const registerSchema = z
  .object({
    firstName: personName("Моля, въведи името си."),
    lastName: personName("Моля, въведи фамилията си."),
    email,
    phone: optionalPhone,
    password,
    confirmPassword: z.string(),
    consent,
    marketingConsent: z.boolean(),
    next: z.string().optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Паролите не съвпадат.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Моля, въведи паролата си."),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Паролите не съвпадат.",
  });

export const profileSchema = z.object({
  firstName: personName("Моля, въведи името си."),
  lastName: personName("Моля, въведи фамилията си."),
  phone: optionalPhone,
  marketingConsent: z.boolean(),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
