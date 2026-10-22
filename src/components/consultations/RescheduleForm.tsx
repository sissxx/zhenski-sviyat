"use client";

import { useState, useTransition, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { FormAlert } from "@/components/forms/FormAlert";
import { rescheduleConsultation } from "@/lib/consultations/actions";
import type { ConsultationSlot } from "@/lib/consultations/types";
import { routes } from "@/lib/routes";
import { SlotPicker } from "./SlotPicker";
import { useFreeSlots } from "./useFreeSlots";

type RescheduleFormProps = { bookingId: string; serviceId: string; specialistId: string; currentStartsAt: string };

/** Picks a new free time with the same specialist and service. The database re-checks rules and overlaps. */
export function RescheduleForm({ bookingId, serviceId, specialistId, currentStartsAt }: RescheduleFormProps) {
  const { slots, reload } = useFreeSlots(serviceId, specialistId);
  const [slot, setSlot] = useState<ConsultationSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!slot) {
      setSlotError("Избери нов час.");
      return;
    }
    startTransition(async () => {
      // On success the action redirects back to the list.
      const result = await rescheduleConsultation(bookingId, slot.startsAt);
      if (!result.ok) {
        setError(result.error);
        setSlot(null);
        reload();
      }
    });
  };

  return (
    <Box component="form" noValidate onSubmit={submit} sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, width: "100%", minWidth: 0 }}>
      <SlotPicker
        slots={slots && slots.filter((s) => s.startsAt !== currentStartsAt)}
        value={slot?.startsAt ?? null}
        onChange={(next) => {
          setSlot(next);
          setSlotError(undefined);
        }}
        error={slotError}
        emptyText="В момента няма други свободни часове при този специалист. Свържи се с нас, ако имаш нужда от помощ."
      />
      {error && <FormAlert severity="error">{error}</FormAlert>}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Преместване…" : "Премести в избрания час"}
        </Button>
        <Button variant="text" href={routes.accountConsultations} disabled={pending}>
          Откажи промяната
        </Button>
      </Box>
    </Box>
  );
}
