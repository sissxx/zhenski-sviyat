"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { deleteMyAccount } from "@/lib/account/delete";

/** "Изтрий профила" at the bottom of Моите данни: opens a confirmation that asks for the account's email. */
export function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      // On success the action signs out and redirects to the login page.
      const result = await deleteMyAccount(email);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <Panel aria-labelledby="delete-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 1.5 }}>
      <Typography id="delete-title" variant="h5" component="h3" sx={{ color: "primary.main" }}>
        Изтриване на профила
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Изтриваме профила, записванията, консултациите и членствата ти. Абонаментът с карта спира веднага. Документите
        за плащанията пазим 10 години, както изисква законът.
      </Typography>
      {!open ? (
        <Button variant="outlined" color="error" onClick={() => setOpen(true)} sx={{ alignSelf: "flex-start" }}>
          Изтрий профила
        </Button>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", maxWidth: 480 }}>
          <TextField
            label="Въведи имейла си, за да потвърдиш"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error && <FormAlert severity="error">{error}</FormAlert>}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button variant="contained" color="error" disabled={pending || !email.trim()} onClick={submit}>
              {pending ? "Изтриване…" : "Изтрий профила завинаги"}
            </Button>
            <Button variant="text" disabled={pending} onClick={() => setOpen(false)}>
              Отказ
            </Button>
          </Box>
        </Box>
      )}
    </Panel>
  );
}
