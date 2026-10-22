"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormAlert } from "@/components/forms/FormAlert";
import { addAvailability, addTimeOff, saveSpecialistServices, type AdminResult } from "@/lib/admin/actions";
import { weekdayLabel } from "@/lib/admin/labels";

type Feedback = { ok: boolean; message: string } | null;

function useSubmit(successMessage: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const submit = (work: () => Promise<AdminResult>, onSuccess?: () => void) =>
    startTransition(async () => {
      setFeedback(null);
      const result = await work();
      if (!result.ok) return setFeedback({ ok: false, message: result.error });
      setFeedback({ ok: true, message: successMessage });
      onSuccess?.();
      router.refresh();
    });
  return { pending, feedback, submit };
}

type ServiceOption = { id: string; name: string; price: string; selected: boolean; ownPrice: string };

/** Which consultation types the specialist offers, each with an optional own price. */
export function SpecialistServicesForm({ specialistId, options }: { specialistId: string; options: ServiceOption[] }) {
  const [items, setItems] = useState(options);
  const { pending, feedback, submit } = useSubmit("Услугите са запазени.");
  const update = (id: string, patch: Partial<ServiceOption>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  if (!options.length) {
    return <Typography sx={{ color: "text.secondary" }}>Първо добави видове консултации.</Typography>;
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
      {items.map((item) => (
        <Box key={item.id} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
          <FormControlLabel
            sx={{ flex: "1 1 240px", mr: 0 }}
            control={<Checkbox checked={item.selected} onChange={(e) => update(item.id, { selected: e.target.checked })} />}
            label={`${item.name} · ${item.price}`}
          />
          <TextField
            size="small"
            label="Собствена цена (€)"
            value={item.ownPrice}
            disabled={!item.selected}
            onChange={(e) => update(item.id, { ownPrice: e.target.value })}
            slotProps={{ htmlInput: { inputMode: "decimal" }, inputLabel: { shrink: true } }}
            sx={{ width: 180 }}
            error={item.ownPrice !== "" && !/^\d{1,6}([.,]\d{1,2})?$/.test(item.ownPrice.trim())}
          />
        </Box>
      ))}
      {feedback && <FormAlert severity={feedback.ok ? "success" : "error"}>{feedback.message}</FormAlert>}
      <Button
        variant="contained"
        disabled={pending}
        sx={{ alignSelf: "flex-start" }}
        onClick={() =>
          submit(() =>
            saveSpecialistServices(
              specialistId,
              items.filter((i) => i.selected).map((i) => ({ typeId: i.id, price: i.ownPrice.trim() })),
            ),
          )
        }
      >
        {pending ? "Запазване…" : "Запази услугите"}
      </Button>
    </Box>
  );
}

/** Adds weekly working hours, for one or several weekdays at once. */
export function AddAvailabilityForm({ specialistId }: { specialistId: string }) {
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const { pending, feedback, submit } = useSubmit("Работното време е добавено.");
  const invalid = !weekdays.length || !start || !end || end <= start || Boolean(validFrom && validUntil && validUntil < validFrom);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <FormControlLabel
            key={day}
            control={
              <Checkbox
                checked={weekdays.includes(day)}
                onChange={(e) => setWeekdays((d) => (e.target.checked ? [...d, day] : d.filter((x) => x !== day)))}
              />
            }
            label={weekdayLabel[day]}
          />
        ))}
      </Box>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
        <TextField label="От" type="time" value={start} onChange={(e) => setStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField
          label="До"
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          error={Boolean(start && end && end <= start)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Валидно от (по избор)"
          type="date"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Валидно до (по избор)"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>
      {feedback && <FormAlert severity={feedback.ok ? "success" : "error"}>{feedback.message}</FormAlert>}
      <Button
        variant="contained"
        disabled={pending || invalid}
        sx={{ alignSelf: "flex-start" }}
        onClick={() => submit(() => addAvailability(specialistId, { weekdays, start, end, validFrom, validUntil }), () => setWeekdays([]))}
      >
        {pending ? "Добавяне…" : "Добави работно време"}
      </Button>
    </Box>
  );
}

/** Blocks a period (holiday, sick day) so no slots are offered in it. */
export function AddTimeOffForm({ specialistId }: { specialistId: string }) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const { pending, feedback, submit } = useSubmit("Отсъствието е добавено.");
  const invalid = !startsAt || !endsAt || endsAt <= startsAt;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 2fr" } }}>
        <TextField
          label="От"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="До"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          error={Boolean(startsAt && endsAt && endsAt <= startsAt)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField label="Причина (по избор)" value={reason} onChange={(e) => setReason(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      {feedback && <FormAlert severity={feedback.ok ? "success" : "error"}>{feedback.message}</FormAlert>}
      <Button
        variant="contained"
        disabled={pending || invalid}
        sx={{ alignSelf: "flex-start" }}
        onClick={() =>
          submit(
            () => addTimeOff(specialistId, { startsAt, endsAt, reason }),
            () => {
              setStartsAt("");
              setEndsAt("");
              setReason("");
            },
          )
        }
      >
        {pending ? "Добавяне…" : "Добави отсъствие"}
      </Button>
    </Box>
  );
}
