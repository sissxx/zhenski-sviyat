"use client";

import type { ReactNode } from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { UseFormRegisterReturn } from "react-hook-form";

/** Optional checkbox with a label, wired to react-hook-form. For the required terms agreement use ConsentCheckbox. */
export function CheckboxField({ registration, label }: { registration: UseFormRegisterReturn; label: ReactNode }) {
  const { ref, ...field } = registration;
  return (
    <FormControlLabel
      control={<Checkbox {...field} slotProps={{ input: { ref } }} />}
      label={label}
      slotProps={{ typography: { variant: "body2" } }}
      sx={{ alignItems: "flex-start", mr: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
    />
  );
}
