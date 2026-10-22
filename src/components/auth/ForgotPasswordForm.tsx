"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { requestPasswordReset } from "@/lib/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth/schemas";

/** Asks for a password reset link. The answer is the same whether or not the email has an account. */
export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);
    const result = await requestPasswordReset(values);
    if (result.ok) setSentTo(values.email);
    else setServerError(result.error);
  };

  if (sentTo) {
    return (
      <FormAlert severity="success">
        Ако има профил с имейл <strong>{sentTo}</strong>, ще получиш линк за нова парола до няколко минути. Линкът е
        валиден един час.
      </FormAlert>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      <FormTextField
        label="Имейл"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      {serverError && <FormAlert severity="error">{serverError}</FormAlert>}
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? "Изпращаме…" : "Изпрати линк"}
      </Button>
    </Box>
  );
}
