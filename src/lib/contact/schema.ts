import { z } from "zod";
import { consent, email, fullName } from "@/lib/validation";

/** The contact form, checked in the browser and again in the server action. */
export const contactSchema = z.object({
  name: fullName,
  email,
  subject: z.string().trim().min(2, "Моля, въведи тема.").max(150, "Темата е твърде дълга."),
  message: z.string().trim().min(10, "Съобщението трябва да е поне 10 знака.").max(3000, "Съобщението е твърде дълго."),
  consent,
  /** Hidden from people; a bot that fills it in is quietly ignored. */
  website: z.string().max(200).optional(),
});

export type ContactValues = z.infer<typeof contactSchema>;
