"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { consent, email, fullName } from "@/lib/validation";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { FormTextField } from "./FormTextField";
import { NotConnectedNotice } from "./NotConnectedNotice";

const schema = z.object({
  name: fullName,
  email,
  subject: z.string().trim().min(2, "Моля, въведи тема.").max(150, "Темата е твърде дълга."),
  message: z.string().trim().min(10, "Съобщението трябва да е поне 10 знака.").max(3000, "Съобщението е твърде дълго."),
  consent,
});

type ContactValues = z.infer<typeof schema>;

/** Contact form. UI only for now: it validates, then says it is not connected yet. */
export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: defaultSubject, message: "", consent: false },
  });

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(() => setSubmitted(true))}
      sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, width: "100%" }}
    >
      <FormTextField label="Име" placeholder="Твоето име" autoComplete="name" registration={register("name")} error={errors.name} />
      <FormTextField
        label="Имейл"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      <FormTextField
        label="Тема"
        placeholder="За какво се отнася запитването?"
        registration={register("subject")}
        error={errors.subject}
      />
      <FormTextField
        label="Съобщение"
        placeholder="Напиши съобщението си…"
        multiline
        minRows={5}
        registration={register("message")}
        error={errors.message}
      />
      <ConsentCheckbox registration={register("consent")} error={errors.consent} />
      <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 220 }}>
        Изпрати съобщение
      </Button>
      {submitted && (
        <NotConnectedNotice>
          Благодарим! Формата за контакт все още не е свързана, затова съобщението не е изпратено.
        </NotConnectedNotice>
      )}
    </Box>
  );
}
