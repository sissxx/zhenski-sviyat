"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { PasswordField } from "@/components/forms/PasswordField";
import { AppLink } from "@/components/ui/AppLink";
import { signIn } from "@/lib/auth/actions";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";
import { routes } from "@/lib/routes";
import { ResendConfirmation } from "./ResendConfirmation";

/** Email and password login. A successful login redirects on the server to `next`. */
export function LoginForm({ next }: { next: string }) {
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    const result = await signIn(values);
    // On success the action redirects, so only failures come back.
    if (result && !result.ok) setServerError({ message: result.error, code: result.code });
  };

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
      <PasswordField
        label="Парола"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password}
      />
      <AppLink href={routes.forgotPassword} variant="body2" sx={{ alignSelf: "flex-end", mt: -1 }}>
        Забравена парола?
      </AppLink>
      {serverError && <FormAlert severity="error">{serverError.message}</FormAlert>}
      {serverError?.code === "email_not_confirmed" && <ResendConfirmation email={getValues("email")} next={next} />}
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? "Влизане…" : "Вход"}
      </Button>
    </Box>
  );
}
