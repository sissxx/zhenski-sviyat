"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { cancelConsultation } from "@/lib/consultations/actions";

/** Cancels one consultation booking after a second click to confirm. */
export function CancelBookingButton({ bookingId, paid }: { bookingId: string; paid: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancel = () =>
    startTransition(async () => {
      const result = await cancelConsultation(bookingId);
      if (!result.ok) setError(result.error);
      setConfirming(false);
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
      {confirming ? (
        <>
          <Typography variant="body2">
            Сигурна ли си, че искаш да откажеш консултацията? Часът ще се освободи за други.
            {paid && " Ако вече си платила, екипът ще се свърже с теб за връщане на сумата."}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button size="small" variant="contained" color="error" onClick={cancel} disabled={pending}>
              {pending ? "Отказване…" : "Да, откажи"}
            </Button>
            <Button size="small" variant="text" onClick={() => setConfirming(false)} disabled={pending}>
              Не
            </Button>
          </Box>
        </>
      ) : (
        <Button size="small" variant="text" onClick={() => setConfirming(true)}>
          Откажи
        </Button>
      )}
      {error && (
        <Typography role="alert" variant="body2" sx={{ color: "error.main" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
