"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChoiceCards } from "@/components/forms/ChoiceCards";
import { ConsentCheckbox } from "@/components/forms/ConsentCheckbox";
import { FormTextField } from "@/components/forms/FormTextField";
import { NotConnectedNotice } from "@/components/forms/NotConnectedNotice";
import {
  consultationFormats,
  type ConsultationFormat,
  type ConsultationSlot,
  type ConsultationType,
  type Specialist,
} from "@/content/consultations";
import { consent, email, fullName, phone } from "@/lib/validation";

const ANY = "any";

const schema = z.object({
  typeSlug: z.string().min(1, "Избери направление."),
  specialistId: z.string(),
  format: z.enum(["online", "in_person"]),
  startsAt: z.string().min(1, "Избери свободен час."),
  name: fullName,
  email,
  phone,
  note: z.string().trim().max(1000, "Бележката е твърде дълга."),
  consent,
});

type BookingValues = z.infer<typeof schema>;

/** `priceLabel` is formatted on the server so the client renders the same text. */
type BookableType = ConsultationType & { priceLabel: string };

type ConsultationBookingProps = {
  types: BookableType[];
  specialists: Specialist[];
  slots: ConsultationSlot[];
};

type Booked = { type: BookableType; specialist?: Specialist; slot: ConsultationSlot; format: ConsultationFormat };

function StepHeading({ step, children }: { step: number; children: string }) {
  return (
    <Typography variant="h6" component="h3" sx={{ fontSize: 17, display: "flex", gap: 1, alignItems: "baseline" }}>
      <Box component="span" sx={{ color: "brand.accent", fontFamily: "var(--font-inter)", fontSize: 14, fontWeight: 600 }}>
        {step}.
      </Box>
      {children}
    </Typography>
  );
}

/**
 * Slot booking for individual consultations: service, specialist, format,
 * day and time, then contact details. UI only for now: slots are mock data
 * and a valid submit shows a summary instead of creating a booking.
 */
export function ConsultationBooking({ types, specialists, slots }: ConsultationBookingProps) {
  const [booked, setBooked] = useState<Booked | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      typeSlug: types[0].slug,
      specialistId: ANY,
      format: types[0].formats[0],
      startsAt: "",
      name: "",
      email: "",
      phone: "",
      note: "",
      consent: false,
    },
  });

  const [typeSlug, specialistId, format, startsAt] = useWatch({ control, name: ["typeSlug", "specialistId", "format", "startsAt"] });
  const type = types.find((t) => t.slug === typeSlug) ?? types[0];
  const typeSpecialists = specialists.filter((s) => type.specialistIds.includes(s.id));

  // One entry per start time; with "any specialist" a time is free if anyone is free then.
  const times = useMemo(() => {
    const candidates = slots.filter(
      (slot) => type.specialistIds.includes(slot.specialistId) && (specialistId === ANY || slot.specialistId === specialistId),
    );
    const byStart = new Map<string, ConsultationSlot>();
    for (const slot of candidates) {
      const current = byStart.get(slot.startsAt);
      if (!current || (current.taken && !slot.taken)) byStart.set(slot.startsAt, slot);
    }
    return [...byStart.values()];
  }, [slots, type, specialistId]);

  const days = useMemo(() => {
    const map = new Map<string, { dateKey: string; label: string; free: number }>();
    for (const slot of times) {
      const entry = map.get(slot.dateKey) ?? { dateKey: slot.dateKey, label: slot.dayLabel, free: 0 };
      if (!slot.taken) entry.free += 1;
      map.set(slot.dateKey, entry);
    }
    return [...map.values()];
  }, [times]);

  const activeDay = days.find((d) => d.dateKey === day && d.free > 0)?.dateKey ?? days.find((d) => d.free > 0)?.dateKey;
  const dayTimes = times.filter((slot) => slot.dateKey === activeDay);

  const resetSlot = () => setValue("startsAt", "");

  const onSubmit = (values: BookingValues) => {
    const slot = times.find((s) => s.startsAt === values.startsAt && !s.taken);
    if (!slot) return;
    setBooked({ type, specialist: specialists.find((s) => s.id === slot.specialistId), slot, format: values.format });
  };

  if (booked) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <Typography variant="h5" component="h3" sx={{ color: "primary.main" }}>
          Проверка на заявката
        </Typography>
        <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1, fontSize: 14 }}>
          {[
            ["Направление", booked.type.name],
            ["Специалист", booked.specialist ? `${booked.specialist.name}, ${booked.specialist.title}` : "—"],
            ["Кога", `${booked.slot.dayLabel}, ${booked.slot.timeLabel} ч. (${booked.type.durationMinutes} мин.)`],
            ["Формат", consultationFormats[booked.format]],
            ["Цена", booked.type.priceLabel],
          ].map(([term, value]) => (
            <Box key={term} sx={{ display: "contents" }}>
              <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
                {term}
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
        <NotConnectedNotice>
          Записването на часове все още не е свързано, затова този час не е запазен. Щом системата заработи, ще получиш
          потвърждение по имейл.
        </NotConnectedNotice>
        <Button variant="outlined" onClick={() => setBooked(null)}>
          Назад към формата
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%" }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
        <StepHeading step={1}>Направление</StepHeading>
        <Controller
          control={control}
          name="typeSlug"
          render={({ field, fieldState }) => (
            <ChoiceCards
              legend="Избери от какво имаш нужда"
              name={field.name}
              value={field.value}
              error={fieldState.error?.message}
              columns={{ xs: 1, sm: 2 }}
              onChange={(next) => {
                field.onChange(next);
                const nextType = types.find((t) => t.slug === next);
                setValue("specialistId", ANY);
                if (nextType && !nextType.formats.includes(format)) setValue("format", nextType.formats[0]);
                setDay(null);
                resetSlot();
              }}
              choices={types.map((t) => ({
                value: t.slug,
                label: t.name,
                hint: `${t.durationMinutes} мин. · ${t.priceLabel}`,
              }))}
            />
          )}
        />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {type.description}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
        <StepHeading step={2}>Специалист и формат</StepHeading>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, width: "100%" }}>
          <Controller
            control={control}
            name="specialistId"
            render={({ field }) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography component="label" htmlFor="booking-specialist" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
                  Специалист
                </Typography>
                <TextField
                  select
                  id="booking-specialist"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.target.value);
                    setDay(null);
                    resetSlot();
                  }}
                >
                  <MenuItem value={ANY}>Без предпочитание</MenuItem>
                  {typeSpecialists.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} · {s.title}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
          />
          <Controller
            control={control}
            name="format"
            render={({ field }) => (
              <ChoiceCards
                legend="Формат"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                columns={{ xs: 2, sm: type.formats.length > 1 ? 2 : 1 }}
                choices={type.formats.map((f) => ({ value: f, label: consultationFormats[f] }))}
              />
            )}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", minWidth: 0 }}>
        <StepHeading step={3}>Ден и час</StepHeading>
        {days.length === 0 ? (
          <Typography sx={{ color: "text.secondary" }}>
            Няма свободни часове през следващите три седмици. Избери друг специалист или ни пиши.
          </Typography>
        ) : (
          <>
            <Box
              role="group"
              aria-label="Ден"
              sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5, width: "100%", scrollbarWidth: "thin" }}
            >
              {days.map((d) => {
                const active = d.dateKey === activeDay;
                return (
                  <Button
                    key={d.dateKey}
                    variant={active ? "contained" : "outlined"}
                    disabled={d.free === 0}
                    aria-pressed={active}
                    onClick={() => {
                      setDay(d.dateKey);
                      resetSlot();
                    }}
                    sx={{ minWidth: 92, flexShrink: 0, flexDirection: "column", lineHeight: 1.3, py: 1 }}
                  >
                    {d.label}
                    <Box component="span" sx={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>
                      {d.free === 0 ? "заето" : `${d.free} св.`}
                    </Box>
                  </Button>
                );
              })}
            </Box>
            <Box role="radiogroup" aria-label="Час" sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", width: "100%" }}>
              {dayTimes.map((slot) => {
                const selected = slot.startsAt === startsAt;
                return (
                  <Button
                    key={slot.startsAt}
                    role="radio"
                    aria-checked={selected}
                    disabled={slot.taken}
                    variant={selected ? "contained" : "outlined"}
                    onClick={() => setValue("startsAt", slot.startsAt, { shouldValidate: true })}
                    sx={{ minWidth: 0, ...(slot.taken && { textDecoration: "line-through" }) }}
                    aria-label={`${slot.dayLabel}, ${slot.timeLabel}${slot.taken ? " — зает" : ""}`}
                  >
                    {slot.timeLabel}
                  </Button>
                );
              })}
            </Box>
            {errors.startsAt && <FormHelperText error>{errors.startsAt.message}</FormHelperText>}
          </>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25, width: "100%" }}>
        <StepHeading step={4}>Твоите данни</StepHeading>
        <FormTextField label="Име и фамилия" placeholder="Въведи името си" autoComplete="name" registration={register("name")} error={errors.name} />
        <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <FormTextField
            label="Имейл"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            registration={register("email")}
            error={errors.email}
          />
          <FormTextField label="Телефон" type="tel" placeholder="Телефон за връзка" autoComplete="tel" registration={register("phone")} error={errors.phone} />
        </Box>
        <FormTextField
          label="Бележка (по желание)"
          placeholder="Накратко за какво искаш да говорим"
          multiline
          minRows={3}
          registration={register("note")}
          error={errors.note}
        />
        <ConsentCheckbox registration={register("consent")} error={errors.consent} />
      </Box>

      <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ minWidth: 220 }}>
        Запази час
      </Button>
    </Box>
  );
}
