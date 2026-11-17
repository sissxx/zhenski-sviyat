import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { AddToCalendarButton } from "@/components/ui/AddToCalendarButton";
import Typography from "@mui/material/Typography";
import { CancelBookingButton } from "@/components/account/CancelBookingButton";
import { EmptyState } from "@/components/account/EmptyState";
import { PaymentDueNote } from "@/components/account/PaymentDueNote";
import { FormAlert } from "@/components/forms/FormAlert";
import { Panel } from "@/components/ui/Panel";
import { bookingActions, getBookingRules, listMyBookings, type MyBooking } from "@/lib/consultations/queries";
import { bookingStatusColors, bookingStatusLabels, specialistLabel, type BookingRules } from "@/lib/consultations/types";
import { formatDateTime, formatPrice, formatTime } from "@/lib/locale";
import { consultationCalendarPath, consultationConfirmationPath, consultationReschedulePath, routes } from "@/lib/routes";

/** Room above the section when the profile menu or a link jumps to it. */
const sectionSx = { display: "flex", flexDirection: "column", gap: 2, scrollMarginTop: { xs: 72, md: 96 } } as const;

const isActive = (b: MyBooking) => b.status === "confirmed" || b.status === "pending_payment";
const isUpcoming = (b: MyBooking) => new Date(b.ends_at).getTime() > Date.now();

/** The member's consultations, upcoming first, on the Моите записвания page. */
export async function MyConsultations({ moved }: { moved: boolean }) {
  const [bookings, rules] = await Promise.all([listMyBookings(), getBookingRules()]);
  const header = (
    <Typography id="konsultatsii-title" variant="h5" component="h3" sx={{ color: "primary.main" }}>
      Консултации
    </Typography>
  );
  if (bookings.length === 0) {
    return (
      <Box component="section" id="konsultatsii" aria-labelledby="konsultatsii-title" sx={sectionSx}>
        {header}
        <EmptyState action={{ label: "Запази консултация", href: routes.consultations }}>
          Все още нямаш запазени консултации. След като запазиш час, тук ще виждаш датата, часа и специалиста, а също ще
          можеш да го преместиш или откажеш.
        </EmptyState>
      </Box>
    );
  }

  const current = bookings.filter((b) => isActive(b) && isUpcoming(b)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const history = bookings.filter((b) => !current.includes(b));

  return (
    <Box component="section" id="konsultatsii" aria-labelledby="konsultatsii-title" sx={sectionSx}>
      {header}
      {moved && <FormAlert severity="success">Консултацията е преместена в новия час.</FormAlert>}
      <BookingGroup title="Предстоящи" items={current} rules={rules} empty="Нямаш предстоящи консултации." />
      {history.length > 0 && <BookingGroup title="История" items={history} rules={rules} />}
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Можеш да откажеш или преместиш потвърден час до {rules.cancelDeadlineHours} ч. преди началото
        {rules.maxReschedules > 0 ? `, като преместванията са до ${rules.maxReschedules} за един час` : ""}. След това се
        свържи с нас.
      </Typography>
      <Button variant="outlined" href={routes.consultations} sx={{ alignSelf: "flex-start" }}>
        Запази нова консултация
      </Button>
    </Box>
  );
}

function BookingGroup({ title, items, rules, empty }: { title: string; items: MyBooking[]; rules: BookingRules; empty?: string }) {
  return (
    <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="h6" component="h4" sx={{ color: "text.secondary", fontSize: 15, fontWeight: 600 }}>
        {title}
      </Typography>
      {items.length === 0 && empty && <Typography sx={{ color: "text.secondary" }}>{empty}</Typography>}
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {items.map((booking) => (
          <li key={booking.id}>
            <BookingCard booking={booking} rules={rules} />
          </li>
        ))}
      </Box>
    </Box>
  );
}

function BookingCard({ booking, rules }: { booking: MyBooking; rules: BookingRules }) {
  const { service, specialist, payment } = booking;
  const pending = booking.status === "pending_payment";
  const { canCancel, canReschedule, pastDeadline } = bookingActions(booking, rules);

  return (
    <Panel tone="card" sx={{ gap: 1.25 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="h6" component="h5" sx={{ color: "primary.main" }}>
          {service?.name ?? "Консултация"}
        </Typography>
        <Chip size="small" label={bookingStatusLabels[booking.status]} color={bookingStatusColors[booking.status]} />
      </Box>
      <Typography variant="body2">
        <time dateTime={booking.starts_at}>{formatDateTime(booking.starts_at)}</time> – {formatTime(booking.ends_at)}
        {specialist && ` · ${specialistLabel({ name: specialist.full_name, title: specialist.title })}`}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {booking.price_cents === 0
          ? "Безплатно"
          : `${formatPrice(booking.price_cents)} · ${booking.payment_method === "bank_transfer" ? "банков превод" : booking.payment_method ? "карта" : "плащане на място"}`}
      </Typography>
      {pending && isUpcoming(booking) && (
        <PaymentDueNote
          amountCents={booking.price_cents}
          deadline={booking.hold_expires_at}
          reference={payment?.provider === "bank_transfer" ? payment.bank_reference : null}
        />
      )}
      {pastDeadline && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Срокът за отказ и преместване е изтекъл. Ако не можеш да дойдеш, свържи се с нас.
        </Typography>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 1.5 }}>
        {isActive(booking) && isUpcoming(booking) && (
          <Button size="small" variant={pending ? "contained" : "outlined"} href={consultationConfirmationPath(booking.id)}>
            {pending ? (payment?.provider === "stripe" ? "Довърши плащането" : "Данни за превода") : "Подробности"}
          </Button>
        )}
        {canReschedule && (
          <Button size="small" variant="outlined" href={consultationReschedulePath(booking.id)}>
            Премести
          </Button>
        )}
        {isActive(booking) && isUpcoming(booking) && <AddToCalendarButton href={consultationCalendarPath(booking.id)} size="small" />}
        {canCancel && <CancelBookingButton bookingId={booking.id} paid={payment?.status === "succeeded"} />}
      </Box>
    </Panel>
  );
}
