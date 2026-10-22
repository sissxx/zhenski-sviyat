"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button, { type ButtonProps } from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import type { AdminResult } from "@/lib/admin/actions";

type ActionButtonProps = {
  label: string;
  /** A server action, usually bound to the item's id. Receives the text from the dialog's input, if any. */
  action: (input: string) => Promise<AdminResult>;
  /** Ask before running: the dialog's question. */
  confirm?: string;
  /** Ask for a text in the dialog (a reason, a note, an amount). */
  input?: { label: string; required?: boolean; defaultValue?: string; inputMode?: "decimal" | "text" };
  confirmLabel?: string;
  successMessage?: string;
  /** Where to go after success, instead of refreshing the page. */
  redirectTo?: string;
  color?: ButtonProps["color"];
  variant?: ButtonProps["variant"];
};

/** Small button for one admin action (confirm a transfer, cancel a registration…), with an optional dialog. */
export function ActionButton({
  label,
  action,
  confirm,
  input,
  confirmLabel = "Потвърди",
  successMessage = "Готово.",
  redirectTo,
  color = "primary",
  variant = "outlined",
}: ActionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(input?.defaultValue ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const execute = () => {
    startTransition(async () => {
      const result = await action(text);
      if (!result.ok) {
        setMessage({ ok: false, text: result.error });
        return;
      }
      setOpen(false);
      setMessage({ ok: true, text: successMessage });
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  const needsDialog = Boolean(confirm || input);

  return (
    <>
      <Button
        size="small"
        color={color}
        variant={variant}
        disabled={pending}
        onClick={() => (needsDialog ? setOpen(true) : execute())}
        sx={{ minWidth: 0, minHeight: 34, px: 1.5, whiteSpace: "nowrap", ...(variant === "outlined" && color !== "primary" ? { borderColor: "currentcolor" } : {}) }}
      >
        {label}
      </Button>
      {needsDialog && (
        <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontFamily: "var(--font-lora), Georgia, serif", color: "primary.main" }}>{label}</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {confirm && <DialogContentText>{confirm}</DialogContentText>}
            {input && (
              <TextField
                autoFocus
                label={input.label}
                value={text}
                onChange={(e) => setText(e.target.value)}
                fullWidth
                multiline={input.inputMode !== "decimal"}
                slotProps={{ htmlInput: { inputMode: input.inputMode ?? "text" }, inputLabel: { shrink: true } }}
                sx={{ mt: 1 }}
              />
            )}
            {message && !message.ok && <Alert severity="error">{message.text}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={() => setOpen(false)} disabled={pending} sx={{ minWidth: 0 }}>
              Затвори
            </Button>
            <Button
              variant="contained"
              color={color}
              onClick={execute}
              disabled={pending || (input?.required === true && !text.trim())}
              sx={{ minWidth: 0 }}
            >
              {pending ? "Изчакай…" : confirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Snackbar
        open={Boolean(message) && !(open && message && !message.ok)}
        autoHideDuration={message?.ok ? 3000 : 6000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={message?.ok ? "success" : "error"} onClose={() => setMessage(null)} variant="filled">
          {message?.text}
        </Alert>
      </Snackbar>
    </>
  );
}
