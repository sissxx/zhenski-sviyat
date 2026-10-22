"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { PasswordField } from "@/components/forms/PasswordField";
import { signUp } from "@/lib/auth/actions";
import { registerSchema, type RegisterValues } from "@/lib/auth/schemas";
import { ResendConfirmation } from "./ResendConfirmation";

/** Sign-up form. On success it asks the user to confirm their email before the first login. */
export function RegisterForm({ next }: { next: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      consent: false,
      marketingConsent: false,
      next,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    const result = await signUp(values);
    if (!result.ok) setServerError(result.error);
    else setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <FormAlert severity="success">
          Почти готово! Изпратихме линк за потвърждение на <strong>{sentTo}</strong>. Отвори го, за да активираш профила
          си.
        </FormAlert>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Не виждаш имейла? Провери папките „Спам“ и „Промоции“ или го изпрати отново.
        </Typography>
        <ResendConfirmation email={sentTo} next={next} />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <FormTextField label="Име" autoComplete="given-name" registration={register("firstName")} error={errors.firstName} />
        <FormTextField
          label="Фамилия"
          autoComplete="family-name"
          registration={register("lastName")}
          error={errors.lastName}
        />
      </Box>
      <FormTextField
        label="Имейл"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      <FormTextField
        label="Телефон (по желание)"
        type="tel"
        placeholder="+359 …"
        autoComplete="tel"
        helperText="Нужен е, ако искаш достъп до Viber общността."
        registration={register("phone")}
        error={errors.phone}
      />
      <PasswordField
        label="Парола"
        autoComplete="new-password"
        helperText="Поне 8 знака, с поне една буква и една цифра."
        registration={register("password")}
        error={errors.password}
      />
      <PasswordField
        label="Повтори паролата"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
      />
      <Box>
        <ConsentCheckbox registration={register("consent")} error={errors.consent} />
        <CheckboxField
          registration={register("marketingConsent")}
          label="Искам да получавам новини за събития и инициативи по имейл."
        />
      </Box>
      {serverError && <FormAlert severity="error">{serverError}</FormAlert>}
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? "Създаваме профила…" : "Създай профил"}
      </Button>
    </Box>
  );
}
