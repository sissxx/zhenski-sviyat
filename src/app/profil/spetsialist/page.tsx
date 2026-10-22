import type { Metadata } from "next";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AddAvailabilityForm, AddTimeOffForm } from "@/components/admin/SpecialistPanels";
import { StatusChip } from "@/components/admin/StatusChip";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { bookingStatus, personName, providerLabel, weekdayLabel } from "@/lib/admin/labels";
import { formatDate, formatDateTime, formatPrice, formatTime } from "@/lib/locale";
import {
  addMyAvailability,
  addMyTimeOff,
  cancelMyBooking,
  deleteMyAvailability,
  deleteMyTimeOff,
  setMyBookingOutcome,
} from "@/lib/specialist/actions";
import { requireSpecialistPage } from "@/lib/specialist/session";

export const metadata: Metadata = { title: "Моят график" };

/** How far back finished consultations are listed, so outcomes can still be recorded. */
const PAST_DAYS = 30;

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

function Row({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <Box
      component="li"
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, py: 1, borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Box sx={{ minWidth: 0, flex: "1 1 260px" }}>{children}</Box>
      {actions && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{actions}</Box>}
    </Box>
  );
}

const listSx = { listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column" } as const;

export default async function SpecialistSchedulePage() {
  const { specialist, supabase } = await requireSpecialistPage();
  const now = new Date();
  const since = new Date(now.getTime() - PAST_DAYS * 86_400_000).toISOString();

  const [{ data: bookings }, { data: hours }, { data: timeOff }, { data: services }] = await Promise.all([
    supabase
      .from("consultation_bookings")
      .select(
        "id, starts_at, ends_at, status, price_cents, payment_method, user_note, cancellation_reason, profiles!consultation_bookings_user_id_fkey(first_name, last_name, email, phone), consultation_types(name)",
      )
      .eq("specialist_id", specialist.id)
      .gte("ends_at", since)
      .order("starts_at"),
    supabase.from("specialist_availability").select("*").eq("specialist_id", specialist.id).order("weekday").order("start_time"),
    supabase.from("specialist_time_off").select("*").eq("specialist_id", specialist.id).gte("ends_at", now.toISOString()).order("starts_at"),
    supabase.from("specialist_consultation_types").select("consultation_types(name)").eq("specialist_id", specialist.id),
  ]);

  const upcoming = (bookings ?? []).filter((b) => new Date(b.ends_at) > now && (b.status === "confirmed" || b.status === "pending_payment"));
  const past = (bookings ?? []).filter((b) => new Date(b.ends_at) <= now && b.status !== "cancelled" && b.status !== "expired").reverse();
  const serviceNames = (services ?? []).flatMap((s) => (s.consultation_types ? [s.consultation_types.name] : []));

  type Booking = NonNullable<typeof bookings>[number];
  // Payments stay admin-only (RLS); "Чака плащане" on the booking tells the specialist enough.
  const bookingDetails = (b: Booking) => (
    <>
      <Typography sx={{ fontWeight: 600 }}>
        {formatDateTime(b.starts_at)} – {formatTime(b.ends_at)} · {b.consultation_types?.name ?? "Консултация"}
      </Typography>
      <Typography variant="body2">
        {personName(b.profiles)}
        {b.profiles?.email ? ` · ${b.profiles.email}` : ""}
        {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
      </Typography>
      {b.user_note && (
        <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary", overflowWrap: "anywhere" }}>
          „{b.user_note}“
        </Typography>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 0.5 }}>
        <StatusChip {...bookingStatus[b.status]} />
        <Typography variant="caption">
          {b.price_cents ? `${formatPrice(b.price_cents)} · ${b.payment_method ? providerLabel[b.payment_method] : "на място"}` : "Безплатна"}
        </Typography>
      </Box>
    </>
  );

  return (
    <>
      <Panel tone="card" sx={{ gap: 1 }}>
        <SectionTitle title="Моят график" />
        <Typography>
          <strong>{specialist.full_name}</strong>
          {specialist.title ? `, ${specialist.title}` : ""}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Услуги: {serviceNames.length ? serviceNames.join(", ") : "още няма"}. Профилът, услугите и цените се променят от
          администратора.
        </Typography>
        {!specialist.is_active && (
          <FormAlert severity="warning">Профилът ти е скрит от сайта и в момента не могат да се запазват часове при теб.</FormAlert>
        )}
        {specialist.is_active && (!serviceNames.length || !hours?.length) && (
          <FormAlert severity="info">
            Часове при теб ще могат да се запазват, щом имаш поне една услуга и работно време.
          </FormAlert>
        )}
      </Panel>

      <Panel sx={{ alignItems: "stretch", gap: 1.5 }}>
        <SectionTitle title="Предстоящи консултации" description="Данните на клиентите са само за връзка по консултацията." />
        {upcoming.length ? (
          <Box component="ul" sx={listSx}>
            {upcoming.map((b) => (
              <Row
                key={b.id}
                actions={
                  <ActionButton
                    label="Откажи"
                    color="error"
                    variant="text"
                    action={cancelMyBooking.bind(null, b.id)}
                    confirm="Консултацията ще бъде отказана и часът ще се освободи. Ако е платена, екипът ще реши за връщането на сумата."
                    input={{ label: "Причина (вижда я клиентът)" }}
                    confirmLabel="Откажи консултацията"
                    successMessage="Консултацията е отказана."
                  />
                }
              >
                {bookingDetails(b)}
              </Row>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>Няма предстоящи консултации.</Typography>
        )}
      </Panel>

      {past.length > 0 && (
        <Panel sx={{ alignItems: "stretch", gap: 1.5 }}>
          <SectionTitle title="Минали консултации" description={`Последните ${PAST_DAYS} дни. Отбележи дали консултацията е проведена.`} />
          <Box component="ul" sx={listSx}>
            {past.map((b) => (
              <Row
                key={b.id}
                actions={
                  b.status === "confirmed" && (
                    <>
                      <ActionButton label="Проведена" variant="outlined" action={setMyBookingOutcome.bind(null, b.id, "completed")} successMessage="Отбелязано." />
                      <ActionButton label="Неявяване" variant="text" action={setMyBookingOutcome.bind(null, b.id, "no_show")} successMessage="Отбелязано." />
                    </>
                  )
                }
              >
                {bookingDetails(b)}
              </Row>
            ))}
          </Box>
        </Panel>
      )}

      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <SectionTitle
          title="Работно време"
          description="Седмичните часове, в които може да се запазва час при теб (българско време). Вече запазените часове не се променят."
        />
        {hours?.length ? (
          <Box component="ul" sx={listSx}>
            {hours.map((h) => (
              <Row
                key={h.id}
                actions={<ActionButton label="Премахни" color="error" variant="text" action={deleteMyAvailability.bind(null, h.id)} successMessage="Премахнато." />}
              >
                <Typography>
                  <strong>{weekdayLabel[h.weekday]}</strong> {h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}
                  {(h.valid_from || h.valid_until) && (
                    <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
                      {" "}
                      · {h.valid_from ? `от ${formatDate(h.valid_from)}` : ""} {h.valid_until ? `до ${formatDate(h.valid_until)}` : ""}
                    </Typography>
                  )}
                </Typography>
              </Row>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>Още няма работно време, затова не се показват свободни часове.</Typography>
        )}
        <AddAvailabilityForm specialistId={specialist.id} action={addMyAvailability} />
      </Panel>

      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <SectionTitle title="Отсъствия" description="Отпуск, болничен и други периоди без консултации. Вече запазените часове не се отменят сами." />
        {timeOff?.length ? (
          <Box component="ul" sx={listSx}>
            {timeOff.map((t) => (
              <Row
                key={t.id}
                actions={<ActionButton label="Премахни" color="error" variant="text" action={deleteMyTimeOff.bind(null, t.id)} successMessage="Премахнато." />}
              >
                <Typography>
                  {formatDateTime(t.starts_at)} – {formatDateTime(t.ends_at)}
                  {t.reason ? ` · ${t.reason}` : ""}
                </Typography>
              </Row>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>Няма предстоящи отсъствия.</Typography>
        )}
        <AddTimeOffForm specialistId={specialist.id} action={addMyTimeOff} />
      </Panel>
    </>
  );
}
