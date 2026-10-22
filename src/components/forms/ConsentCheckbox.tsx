"use client";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Box from "@mui/material/Box";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { AppLink } from "@/components/ui/AppLink";
import { routes } from "@/lib/routes";

/** Required agreement to the privacy policy and terms, shown above a form's submit button. */
export function ConsentCheckbox({ registration, error }: { registration: UseFormRegisterReturn; error?: FieldError }) {
  const { ref, ...field } = registration;
  return (
    <Box>
      <FormControlLabel
        control={<Checkbox {...field} slotProps={{ input: { ref, "aria-invalid": Boolean(error) } }} />}
        label={
          <>
            Съгласна съм с <AppLink href={routes.privacy}>Политиката за поверителност</AppLink> и{" "}
            <AppLink href={routes.terms}>Общите условия</AppLink>.
          </>
        }
        slotProps={{ typography: { variant: "body2" } }}
        sx={{ alignItems: "flex-start", mr: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
      />
      {error && <FormHelperText error>{error.message}</FormHelperText>}
    </Box>
  );
}
