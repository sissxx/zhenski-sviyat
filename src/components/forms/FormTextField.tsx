"use client";

import Box from "@mui/material/Box";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

type FormTextFieldProps = Omit<TextFieldProps, "label" | "error" | "name"> & {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
};

/** Text input with its label above it (as in the Figma forms), wired to react-hook-form. */
export function FormTextField({ label, registration, error, id, helperText, slotProps, ...props }: FormTextFieldProps) {
  const inputId = id ?? `field-${registration.name}`;
  const labelId = `${inputId}-label`;
  const { ref, ...field } = registration;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
      <Typography component="label" id={labelId} htmlFor={inputId} sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
        {label}
      </Typography>
      <TextField
        id={inputId}
        fullWidth
        inputRef={ref}
        error={Boolean(error)}
        helperText={error?.message ?? helperText}
        {...field}
        {...props}
        // A select is a button, which <label htmlFor> doesn't name; point it at the label instead.
        slotProps={props.select ? { ...slotProps, select: { labelId, ...slotProps?.select } } : slotProps}
      />
    </Box>
  );
}
