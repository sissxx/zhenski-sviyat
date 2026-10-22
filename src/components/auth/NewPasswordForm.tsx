"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { PasswordField } from "@/components/forms/PasswordField";
import { TextLink } from "@/components/ui/AppLink";
import { updatePassword } from "@/lib/auth/actions";
import { newPasswordSchema, type NewPasswordValues } from "@/lib/auth/schemas";
import { routes } from "@/lib/routes";

/** Sets a new password for the signed-in user, after a reset link or from the profile. */
export function NewPasswordForm() {
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: NewPasswordValues) => {
    setServerError(null);
    const result = await updatePassword(values);
    if (result && !result.ok) setServerError({ message: result.error, code: result.code });
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      <PasswordField
        label="Нова парола"
        autoComplete="new-password"
        helperText="Поне 8 знака, с поне една буква и една цифра."
        registration={register("password")}
        error={errors.password}
      />
      <PasswordField
        label="Повтори новата парола"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
      />
      {serverError && (
        <FormAlert severity="error">
          {serverError.message}{" "}
          {serverError.code === "session_not_found" && (
            <TextLink href={routes.forgotPassword}>Поискай нов линк.</TextLink>
          )}
        </FormAlert>
      )}
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? "Запазваме…" : "Запази паролата"}
      </Button>
    </Box>
  );
}
