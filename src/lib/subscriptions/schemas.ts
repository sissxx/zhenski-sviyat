import { z } from "zod";
import { phone } from "@/lib/validation";

/** "Add me to the Viber group": the number the team should look for, and optionally the name shown in Viber. */
export const viberRequestSchema = z.object({
  phone,
  displayName: z.string().trim().max(80, "Името е твърде дълго."),
});

export type ViberRequestValues = z.input<typeof viberRequestSchema>;
