"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

export type Choice<T extends string> = { value: T; label: string; hint?: ReactNode; disabled?: boolean };

type ChoiceCardsProps<T extends string> = {
  legend: string;
  name: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
  columns?: { xs?: number; sm?: number };
};

/** Radio group drawn as selectable cards (Figma payment choices, frame 12:675). */
export function ChoiceCards<T extends string>({ legend, name, choices, value, onChange, error, columns }: ChoiceCardsProps<T>) {
  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, width: "100%", minWidth: 0 }}>
      <Typography component="legend" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main", mb: 1, p: 0 }}>
        {legend}
      </Typography>
      <RadioGroup
        name={name}
        value={value}
        onChange={(_, next) => onChange(next as T)}
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: `repeat(${columns?.xs ?? 1}, minmax(0, 1fr))`,
            sm: `repeat(${columns?.sm ?? columns?.xs ?? 1}, minmax(0, 1fr))`,
          },
        }}
      >
        {choices.map((choice) => {
          const selected = value === choice.value;
          return (
            <FormControlLabel
              key={choice.value}
              value={choice.value}
              disabled={choice.disabled}
              control={<Radio size="small" />}
              label={
                <>
                  <Typography component="span" sx={{ display: "block", fontWeight: selected ? 600 : 500, fontSize: 14 }}>
                    {choice.label}
                  </Typography>
                  {choice.hint && (
                    <Typography component="span" sx={{ display: "block", fontSize: 13, color: "text.secondary" }}>
                      {choice.hint}
                    </Typography>
                  )}
                </>
              }
              sx={{
                m: 0,
                p: 1.25,
                alignItems: "flex-start",
                bgcolor: selected ? "brand.mint" : "brand.card",
                border: "1px solid",
                borderColor: selected ? "primary.main" : "divider",
                borderRadius: "10px",
                "& .MuiRadio-root": { p: 0.5, mr: 1 },
              }}
            />
          );
        })}
      </RadioGroup>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
