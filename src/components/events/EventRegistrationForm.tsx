"use client";

import { useState, useTransition, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { PaymentMethodField, type PaymentMethod } from "@/components/forms/PaymentMethodField";
import { registerForEvent } from "@/lib/events/actions";
import { formatPrice } from "@/lib/locale";

type EventRegistrationFormProps = { slug: string; priceCents: number };

/**
 * Event sign-up for a signed-in user. The profile supplies name, email and phone, so the form only
 * asks how to pay. Card payment (Stripe) comes later; until then paid events are paid by bank transfer.
 */
export function EventRegistrationForm({ slug, priceCents }: EventRegistrationFormProps) {
  const paid = priceCents > 0;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the confirmation page.
      const result = await registerForEvent({ slug, paymentMethod: paid && paymentMethod === "bank" ? "bank" : undefined });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submit}
      sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, width: "100%" }}
    >
      {paid && <PaymentMethodField value={paymentMethod} onChange={setPaymentMethod} cardAvailable={false} />}
      {error && <FormAlert severity="error">{error}</FormAlert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Button type="submit" variant="contained" disabled={pending} sx={{ minWidth: 260 }}>
          {pending ? "Изпращане…" : paid ? `Заяви участие · ${formatPrice(priceCents)}` : "Запиши се"}
        </Button>
        {paid && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            След заявката ще видиш данните за превода. Мястото ти се пази, докато преводът пристигне.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
