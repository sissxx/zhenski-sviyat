"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { FormAlert } from "@/components/forms/FormAlert";
import { FormTextField } from "@/components/forms/FormTextField";
import { updateProfile } from "@/lib/auth/actions";
import { profileSchema, type ProfileValues } from "@/lib/auth/schemas";

/** Edits the user's own profile. The email follows the login and can't be changed here. */
export function ProfileForm({ email, defaultValues }: { email: string; defaultValues: ProfileValues }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues });

  const onSubmit = async (values: ProfileValues) => {
    setResult(null);
    const response = await updateProfile(values);
    if (response.ok) {
      reset(values);
      setResult({ ok: true, message: "Данните са запазени." });
    } else {
      setResult({ ok: false, message: response.error });
    }
  };

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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography component="label" htmlFor="field-email" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
          Имейл
        </Typography>
        <TextField id="field-email" value={email} disabled fullWidth helperText="Имейлът е и името за вход." />
      </Box>
      <FormTextField
        label="Телефон"
        type="tel"
        placeholder="+359 …"
        autoComplete="tel"
        helperText="Използваме го, за да те добавим във Viber групата и при промяна на събитие."
        registration={register("phone")}
        error={errors.phone}
      />
      <CheckboxField
        registration={register("marketingConsent")}
        label="Искам да получавам новини за събития и инициативи по имейл."
      />
      {result && <FormAlert severity={result.ok ? "success" : "error"}>{result.message}</FormAlert>}
      <Button type="submit" variant="contained" disabled={isSubmitting || !isDirty} sx={{ alignSelf: "flex-start", minWidth: 200 }}>
        {isSubmitting ? "Запазваме…" : "Запази промените"}
      </Button>
    </Box>
  );
}
