"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { sendContactMessage } from "@/lib/contact/actions";
import { contactSchema, type ContactValues } from "@/lib/contact/schema";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { FormAlert } from "./FormAlert";
import { FormTextField } from "./FormTextField";

/** Contact form. The message is saved for the admins (Админ → Съобщения) and emailed to them. */
export function ContactForm({ defaultSubject = "" }: { defaultSubject?: string }) {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: defaultSubject, message: "", consent: false, website: "" },
  });

  const onSubmit = async (values: ContactValues) => {
    setResult(null);
    try {
      const response = await sendContactMessage(values);
      if (response.ok) {
        reset({ name: "", email: "", subject: "", message: "", consent: false, website: "" });
        setResult({ ok: true, text: "Благодарим! Съобщението е изпратено. Ще ти отговорим на посочения имейл." });
      } else {
        setResult({ ok: false, text: response.error });
      }
    } catch {
      setResult({ ok: false, text: "Съобщението не беше изпратено. Моля, провери връзката си и опитай отново." });
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
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
      {/* Trap for bots: hidden from people and screen readers, so only a bot fills it in. */}
      <Box aria-hidden sx={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Уебсайт
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </Box>
      <ConsentCheckbox registration={register("consent")} error={errors.consent} />
      <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 220 }}>
        {isSubmitting ? "Изпращане…" : "Изпрати съобщение"}
      </Button>
      {result && <FormAlert severity={result.ok ? "success" : "error"}>{result.text}</FormAlert>}
    </Box>
  );
}
