"use client";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Box from "@mui/material/Box";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { TextLink } from "@/components/ui/AppLink";
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
            Съгласна съм с <TextLink href={routes.privacy}>Политиката за поверителност</TextLink> и{" "}
            <TextLink href={routes.terms}>Общите условия</TextLink>.
          </>
        }
        slotProps={{ typography: { variant: "body2" } }}
        sx={{ alignItems: "flex-start", mr: 0, "& .MuiCheckbox-root": { pt: 0.25 } }}
      />
      {error && <FormHelperText error>{error.message}</FormHelperText>}
    </Box>
  );
}
