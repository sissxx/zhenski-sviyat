"use client";

import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";

/**
 * Newsletter sign-up. Not connected yet: Brevo will be wired in once the
 * account is set up, so for now the form only validates and says so.
 */
export function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "invalid" | "pending">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    if (typeof email !== "string" || !form.checkValidity() || !email.trim()) {
      setStatus("invalid");
      return;
    }
    setStatus("pending");
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Typography component="label" htmlFor="newsletter-email" sx={{ fontWeight: 600, fontSize: 13, color: "brand.paper" }}>
        Абонирай се за новини
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <InputBase
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Твоят имейл"
          autoComplete="email"
          inputProps={{ "aria-describedby": "newsletter-status" }}
          onChange={() => status !== "idle" && setStatus("idle")}
          sx={{ flex: 1, minWidth: 0, bgcolor: "brand.paper", borderRadius: "8px", px: 1.25, height: 40, fontSize: 13 }}
        />
        <Button type="submit" variant="contained" color="onDark" sx={{ minWidth: 0, minHeight: 40, px: 2 }}>
          Изпрати
        </Button>
      </Box>
      <Typography id="newsletter-status" role="status" sx={{ fontSize: 12, color: "brand.sage", minHeight: 18 }}>
        {status === "invalid" && "Моля, въведи валиден имейл адрес."}
        {status === "pending" && "Благодарим! Бюлетинът стартира скоро."}
      </Typography>
    </Box>
  );
}
