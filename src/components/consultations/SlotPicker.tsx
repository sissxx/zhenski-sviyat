"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import type { ConsultationSlot } from "@/lib/consultations/types";

type SlotPickerProps = {
  /** Free slots, or null while they load. */
  slots: ConsultationSlot[] | null;
  value: string | null;
  onChange: (slot: ConsultationSlot | null) => void;
  error?: string;
  emptyText: string;
};

/** Day strip, then the free start times of that day. Only free times are listed. */
export function SlotPicker({ slots, value, onChange, error, emptyText }: SlotPickerProps) {
  const [day, setDay] = useState<string | null>(null);

  if (slots === null) {
    return (
      <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
        <CircularProgress size={18} />
        <Typography variant="body2">Зареждане на свободните часове…</Typography>
      </Box>
    );
  }
  if (slots.length === 0) return <Typography sx={{ color: "text.secondary" }}>{emptyText}</Typography>;

  const days = [...new Map(slots.map((s) => [s.dateKey, { dateKey: s.dateKey, label: s.dayLabel, count: 0 }])).values()];
  for (const slot of slots) days.find((d) => d.dateKey === slot.dateKey)!.count += 1;
  const selectedDay = slots.find((s) => s.startsAt === value)?.dateKey;
  const activeDay = days.find((d) => d.dateKey === (day ?? selectedDay))?.dateKey ?? days[0].dateKey;
  const dayTimes = slots.filter((slot) => slot.dateKey === activeDay);

  return (
    <>
      <Box role="group" aria-label="Ден" sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, width: "100%", scrollbarWidth: "thin" }}>
        {days.map((d) => {
          const active = d.dateKey === activeDay;
          return (
            <Button
              key={d.dateKey}
              variant={active ? "contained" : "outlined"}
              aria-pressed={active}
              onClick={() => {
                setDay(d.dateKey);
                if (d.dateKey !== selectedDay) onChange(null);
              }}
              sx={{ minWidth: 92, flexShrink: 0, flexDirection: "column", lineHeight: 1.3, py: 1 }}
            >
              {d.label}
              <Box component="span" sx={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
                {d.count} св.
              </Box>
            </Button>
          );
        })}
      </Box>
      <Box role="radiogroup" aria-label="Час" sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", width: "100%" }}>
        {dayTimes.map((slot) => {
          const selected = slot.startsAt === value;
          return (
            <Button
              key={slot.startsAt}
              role="radio"
              aria-checked={selected}
              variant={selected ? "contained" : "outlined"}
              onClick={() => onChange(slot)}
              sx={{ minWidth: 0 }}
              aria-label={`${slot.dayLabel}, ${slot.timeLabel}`}
            >
              {slot.timeLabel}
            </Button>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </>
  );
}
