import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { loginSchema, newPasswordSchema, profileSchema, registerSchema } from "@/lib/auth/schemas";
import { consent, email, fullName, phone } from "@/lib/validation";

const firstError = (schema: z.ZodType, value: unknown) => {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0];
};

describe("shared form rules", () => {
  it("trims and checks email", () => {
    expect(email.parse("  maria@example.bg ")).toBe("maria@example.bg");
    expect(firstError(email, "")?.message).toBe("Моля, въведи имейл адрес.");
    expect(firstError(email, "maria@")?.message).toBe("Моля, въведи валиден имейл адрес.");
  });

  it("accepts Bulgarian and international phone numbers", () => {
    for (const ok of ["0888 123 456", "+359 88 812 3456", "(02) 981-11-22"]) expect(phone.safeParse(ok).success, ok).toBe(true);
    expect(firstError(phone, "")?.message).toBe("Моля, въведи телефон за връзка.");
    expect(firstError(phone, "088-abc")?.message).toBe("Моля, въведи валиден телефонен номер.");
  });

  it("requires a full name and consent", () => {
    expect(firstError(fullName, " М ")?.message).toBe("Моля, въведи име и фамилия.");
    expect(firstError(consent, false)?.message).toBe("Необходимо е съгласие, за да продължиш.");
  });
});

describe("account schemas", () => {
  const valid = {
    firstName: "Мария",
    lastName: "Иванова",
    email: "maria@example.bg",
    phone: "",
    password: "парола123",
    confirmPassword: "парола123",
    consent: true,
    marketingConsent: false,
  };

  it("accepts a valid sign-up, with or without a phone", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, phone: "0888123456" }).success).toBe(true);
  });

  it("allows Cyrillic letters in passwords but needs a letter and a digit", () => {
    expect(firstError(registerSchema, { ...valid, password: "12345678", confirmPassword: "12345678" })?.message).toBe(
      "Паролата трябва да съдържа поне една буква.",
    );
    expect(firstError(registerSchema, { ...valid, password: "паролапарола", confirmPassword: "паролапарола" })?.message).toBe(
      "Паролата трябва да съдържа поне една цифра.",
    );
    expect(firstError(registerSchema, { ...valid, password: "аб1", confirmPassword: "аб1" })?.message).toBe(
      "Паролата трябва да е поне 8 знака.",
    );
  });

  it("flags mismatched passwords on the confirm field", () => {
    const issue = firstError(registerSchema, { ...valid, confirmPassword: "друга123" });
    expect(issue?.path).toEqual(["confirmPassword"]);
    expect(issue?.message).toBe("Паролите не съвпадат.");
    expect(firstError(newPasswordSchema, { password: "парола123", confirmPassword: "x" })?.path).toEqual(["confirmPassword"]);
  });

  it("requires consent to the terms", () => {
    expect(firstError(registerSchema, { ...valid, consent: false })?.path).toEqual(["consent"]);
  });

  it("validates login and profile", () => {
    expect(firstError(loginSchema, { email: "maria@example.bg", password: "" })?.message).toBe("Моля, въведи паролата си.");
    expect(firstError(profileSchema, { firstName: "", lastName: "И", phone: "", marketingConsent: true })?.message).toBe(
      "Моля, въведи името си.",
    );
  });
});
