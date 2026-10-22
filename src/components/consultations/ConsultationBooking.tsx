"use client";

import { useState, useTransition, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChoiceCards } from "@/components/forms/ChoiceCards";
import { FormAlert } from "@/components/forms/FormAlert";
import { PaymentMethodField, type PaymentMethod } from "@/components/forms/PaymentMethodField";
import { TextLink } from "@/components/ui/AppLink";
import { bookConsultation } from "@/lib/consultations/actions";
import {
  paymentModeOf,
  specialistLabel,
  type ConsultationService,
  type ConsultationSlot,
  type ServiceSpecialist,
} from "@/lib/consultations/types";
import { loginPath, routes } from "@/lib/routes";
import { SlotPicker } from "./SlotPicker";
import { useFreeSlots } from "./useFreeSlots";

const ANY = "any";

/** Labels are formatted on the server so the client renders the same text. */
export type BookableService = Omit<ConsultationService, "specialists"> & {
  priceLabel: string;
  specialists: (ServiceSpecialist & { priceLabel: string })[];
};

export type BookingViewer =
  | { kind: "guest" }
  | { kind: "suspended" }
  | { kind: "user"; name: string; email: string; phone: string | null };

type ConsultationBookingProps = {
  services: BookableService[];
  viewer: BookingViewer;
  /** False while Stripe isn't set up: card-only services can't be booked online yet. */
  cardAvailable: boolean;
  initialServiceSlug?: string;
  initialSpecialistSlug?: string;
};

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

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1, fontSize: 14 }}>
      {rows.map(([term, value]) => (
        <Box key={term} sx={{ display: "contents" }}>
          <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
            {term}
          </Typography>
          <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Slot booking for individual consultations: service, specialist, day and time, then confirm.
 * Free times come from the database; the booking itself is created and re-checked on the server.
 * Visitors can browse times, and log in to book.
 */
export function ConsultationBooking({ services, viewer, cardAvailable, initialServiceSlug, initialSpecialistSlug }: ConsultationBookingProps) {
  const initialService = services.find((s) => s.slug === initialServiceSlug) ?? services[0];
  const [serviceId, setServiceId] = useState(initialService.id);
  const [specialistId, setSpecialistId] = useState(
    initialService.specialists.find((s) => s.slug === initialSpecialistSlug)?.id ?? ANY,
  );
  const [slot, setSlot] = useState<ConsultationSlot | null>(null);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(cardAvailable ? "card" : "bank");
  const [slotError, setSlotError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const service = services.find((s) => s.id === serviceId) ?? services[0];
  const { slots, reload } = useFreeSlots(service.id, specialistId === ANY ? null : specialistId);
  const specialist = slot ? service.specialists.find((s) => s.id === slot.specialistId) : undefined;
  const mode = specialist ? paymentModeOf(service, specialist.priceCents) : null;
  const prepaid = mode === "bank" || mode === "card_only";
  // Card-only services always go to Stripe; the others let the user pick.
  const method: PaymentMethod = mode === "card_only" ? "card" : paymentMethod;

  const pickService = (id: string) => {
    setServiceId(id);
    setSpecialistId(ANY);
    setSlot(null);
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!slot || !specialist) {
      setSlotError("Избери свободен час.");
      return;
    }
    startTransition(async () => {
      // On success the action redirects to Stripe Checkout or the confirmation page.
      const result = await bookConsultation({
        serviceId: service.id,
        specialistId: specialist.id,
        startsAt: slot.startsAt,
        note,
        paymentMethod: prepaid ? method : undefined,
      });
      if (!result.ok) {
        setError(result.error);
        setSlot(null);
        reload();
      }
    });
  };

  const returnTo = `${routes.consultations}?usluga=${service.slug}${
    specialistId !== ANY ? `&spetsialist=${service.specialists.find((s) => s.id === specialistId)?.slug}` : ""
  }`;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submit}
      sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, width: "100%" }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
        <StepHeading step={1}>Направление</StepHeading>
        <ChoiceCards
          legend="Избери от какво имаш нужда"
          name="service"
          value={service.id}
          columns={{ xs: 1, sm: 2 }}
          onChange={pickService}
          choices={services.map((s) => ({
            value: s.id,
            label: s.name,
            hint: [`${s.durationMinutes} мин.`, s.priceLabel].filter(Boolean).join(" · "),
          }))}
        />
        {service.description && (
          <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
            {service.description}
          </Typography>
        )}
        {service.locationInfo && (
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            <Box component="strong">Къде: </Box>
            {service.locationInfo}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%" }}>
        <StepHeading step={2}>Специалист</StepHeading>
        <TextField
          select
          id="booking-specialist"
          label="Специалист"
          value={specialistId}
          onChange={(event) => {
            setSpecialistId(event.target.value);
            setSlot(null);
          }}
          sx={{ maxWidth: 420, width: "100%" }}
        >
          {service.specialists.length > 1 && <MenuItem value={ANY}>Без предпочитание</MenuItem>}
          {service.specialists.length === 1 && <MenuItem value={ANY}>{specialistLabel(service.specialists[0])}</MenuItem>}
          {service.specialists.length > 1 &&
            service.specialists.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {specialistLabel(s)}
              </MenuItem>
            ))}
        </TextField>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, width: "100%", minWidth: 0 }}>
        <StepHeading step={3}>Ден и час</StepHeading>
        <SlotPicker
          slots={slots}
          value={slot?.startsAt ?? null}
          onChange={(next) => {
            setSlot(next);
            setSlotError(undefined);
          }}
          error={slotError}
          emptyText="В момента няма свободни часове за този избор. Избери друг специалист или ни пиши."
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
        <StepHeading step={4}>Потвърждение</StepHeading>
        {slot && specialist ? (
          <Facts
            rows={[
              ["Направление", service.name],
              ["Специалист", specialistLabel(specialist)],
              ["Кога", `${slot.dayLabel}, ${slot.timeLabel} ч. (${service.durationMinutes} мин.)`],
              ["Цена", specialist.priceLabel],
            ]}
          />
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Избери свободен час, за да видиш подробностите.
          </Typography>
        )}

        {viewer.kind === "guest" ? (
          <>
            <Typography>За да запазиш час, влез в профила си. Така ще виждаш и управляваш консултациите си на едно място.</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Button variant="contained" href={loginPath(returnTo)}>
                Вход
              </Button>
              <Button variant="outlined" href={`${routes.register}?next=${encodeURIComponent(returnTo)}`}>
                Създай профил
              </Button>
            </Box>
          </>
        ) : viewer.kind === "suspended" ? (
          <FormAlert severity="warning">
            Профилът ти е временно спрян и не можеш да запазваш консултации. Свържи се с нас за повече информация.
          </FormAlert>
        ) : mode === "card_only" && !cardAvailable ? (
          <>
            <Typography>
              Тази консултация се плаща с карта, а онлайн плащането ще бъде достъпно съвсем скоро. Дотогава можеш да
              запазиш час, като се свържеш с нас.
            </Typography>
            <Button variant="outlined" href={routes.contacts}>
              Свържи се с нас
            </Button>
          </>
        ) : (
          <>
            <Facts rows={[["Име", viewer.name || "—"], ["Имейл", viewer.email], ["Телефон", viewer.phone || "—"]]} />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Данните са от профила ти. <TextLink href={routes.accountDetails}>Промени ги</TextLink>, ако нещо не е вярно.
            </Typography>
            <TextField
              label="Бележка (по желание)"
              placeholder="Накратко за какво искаш да говорим"
              multiline
              minRows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              error={note.length > 1000}
              helperText={note.length > 1000 ? "Бележката е твърде дълга." : undefined}
              sx={{ width: "100%" }}
            />
            {prepaid && (
              <PaymentMethodField
                value={method}
                onChange={setPaymentMethod}
                cardAvailable={cardAvailable}
                bankAvailable={mode === "bank"}
              />
            )}
            {error && <FormAlert severity="error">{error}</FormAlert>}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={pending || note.length > 1000 || (prepaid && method === "card" && !cardAvailable)}
                sx={{ minWidth: 220 }}
              >
                {pending
                  ? "Изпращане…"
                  : !prepaid
                    ? "Запази час"
                    : method === "card"
                      ? "Запази час и плати с карта"
                      : "Заяви час и плати с превод"}
              </Button>
              {prepaid && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {method === "card"
                    ? "Ще те прехвърлим към защитената страница на Stripe. Часът ти се пази 30 минути, докато платиш."
                    : "След заявката ще видиш данните за превода. Часът ти се пази, докато преводът пристигне."}
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
