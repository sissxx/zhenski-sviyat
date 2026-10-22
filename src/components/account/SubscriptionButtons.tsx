"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { setCardSubscriptionCancelled, subscribeByBankTransfer, subscribeByCard } from "@/lib/subscriptions/actions";

type SubscribeButtonsProps = {
  planId: string;
  card: boolean;
  bank: boolean;
  /** Label of the bank button, e.g. "Поднови с превод" for a renewal. */
  bankLabel?: string;
};

/** "Плати с карта" and/or "Банков превод" for one plan. Both actions redirect on success. */
export function SubscribeButtons({ planId, card, bank, bankLabel = "Банков превод" }: SubscribeButtonsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<"card" | "bank" | null>(null);

  const run = (method: "card" | "bank") =>
    startTransition(async () => {
      setError(null);
      setChosen(method);
      const result = method === "card" ? await subscribeByCard(planId) : await subscribeByBankTransfer(planId);
      if (!result.ok) setError(result.error);
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, alignItems: "flex-start" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
        {card && (
          <Button variant="contained" onClick={() => run("card")} disabled={pending}>
            {pending && chosen === "card" ? "Прехвърляне към Stripe…" : "Плати с карта"}
          </Button>
        )}
        {bank && (
          <Button variant={card ? "outlined" : "contained"} onClick={() => run("bank")} disabled={pending}>
            {pending && chosen === "bank" ? "Изпращане…" : bankLabel}
          </Button>
        )}
      </Box>
      {error && <FormAlert severity="error">{error}</FormAlert>}
    </Box>
  );
}

/** Stops a card subscription at the end of the paid period (after a second click), or resumes it. */
export function CardSubscriptionToggle({ subscriptionId, cancelling }: { subscriptionId: string; cancelling: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (cancel: boolean) =>
    startTransition(async () => {
      setError(null);
      const result = await setCardSubscriptionCancelled(subscriptionId, cancel);
      if (!result.ok) setError(result.error);
      setConfirming(false);
    });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start" }}>
      {cancelling ? (
        <Button size="small" variant="outlined" onClick={() => run(false)} disabled={pending}>
          {pending ? "Записване…" : "Продължи абонамента"}
        </Button>
      ) : confirming ? (
        <>
          <Typography variant="body2">
            Абонаментът няма да се поднови. Достъпът остава до края на платения период.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button size="small" variant="contained" color="error" onClick={() => run(true)} disabled={pending}>
              {pending ? "Записване…" : "Да, прекрати"}
            </Button>
            <Button size="small" variant="text" onClick={() => setConfirming(false)} disabled={pending}>
              Не
            </Button>
          </Box>
        </>
      ) : (
        <Button size="small" variant="text" onClick={() => setConfirming(true)}>
          Прекрати абонамента
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
