"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { resendConfirmation } from "@/lib/auth/actions";

/** Sends the sign-up confirmation email again. */
export function ResendConfirmation({ email, next }: { email: string; next?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    setState("sending");
    setError(null);
    const result = await resendConfirmation({ email }, next);
    if (result.ok) {
      setState("sent");
    } else {
      setError(result.error);
      setState("idle");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "flex-start" }}>
      {state === "sent" ? (
        <FormAlert severity="success">Изпратихме нов линк за потвърждение.</FormAlert>
      ) : (
        <Button variant="outlined" onClick={resend} disabled={state === "sending"}>
          {state === "sending" ? "Изпращаме…" : "Изпрати линка отново"}
        </Button>
      )}
      {error && <FormAlert severity="error">{error}</FormAlert>}
    </Box>
  );
}
