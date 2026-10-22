"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { continueCardPayment } from "@/lib/payments/actions";

/** "Плати с карта" for a pending card payment: back to Stripe Checkout. */
export function CardPaymentButton({ paymentId, label = "Плати с карта" }: { paymentId: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pay = () =>
    startTransition(async () => {
      setError(null);
      // On success the action redirects to Stripe.
      const result = await continueCardPayment(paymentId);
      if (!result.ok) setError(result.error);
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, alignItems: "flex-start" }}>
      <Button variant="contained" onClick={pay} disabled={pending} sx={{ minWidth: 220 }}>
        {pending ? "Прехвърляне към Stripe…" : label}
      </Button>
      {error && <FormAlert severity="error">{error}</FormAlert>}
    </Box>
  );
}
