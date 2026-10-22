"use client";

import { useState, useTransition, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { PaymentMethodField, type PaymentMethod } from "@/components/forms/PaymentMethodField";
import { registerForEvent } from "@/lib/events/actions";
import { formatPrice } from "@/lib/locale";

type EventRegistrationFormProps = {
  slug: string;
  priceCents: number;
  /** False while Stripe isn't set up: the card option shows as coming soon. */
  cardAvailable: boolean;
  /** False when the event takes card payments only. */
  bankAvailable: boolean;
};

/**
 * Event sign-up for a signed-in user. The profile supplies name, email and phone, so the form only
 * asks how to pay: by card (Stripe Checkout) or bank transfer.
 */
export function EventRegistrationForm({ slug, priceCents, cardAvailable, bankAvailable }: EventRegistrationFormProps) {
  const paid = priceCents > 0;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(cardAvailable || !bankAvailable ? "card" : "bank");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the action redirects to Stripe Checkout or the confirmation page.
      const result = await registerForEvent({ slug, paymentMethod: paid ? paymentMethod : undefined });
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
      {paid && (
        <PaymentMethodField
          value={paymentMethod}
          onChange={setPaymentMethod}
          cardAvailable={cardAvailable}
          bankAvailable={bankAvailable}
        />
      )}
      {error && <FormAlert severity="error">{error}</FormAlert>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Button type="submit" variant="contained" disabled={pending || (paid && paymentMethod === "card" && !cardAvailable)} sx={{ minWidth: 260 }}>
          {pending
            ? "Изпращане…"
            : !paid
              ? "Запиши се"
              : paymentMethod === "card"
                ? `Плати с карта · ${formatPrice(priceCents)}`
                : `Заяви участие · ${formatPrice(priceCents)}`}
        </Button>
        {paid && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {paymentMethod === "card"
              ? "Ще те прехвърлим към защитената страница на Stripe. Мястото ти се пази 30 минути, докато платиш."
              : "След заявката ще видиш данните за превода. Мястото ти се пази, докато преводът пристигне."}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
