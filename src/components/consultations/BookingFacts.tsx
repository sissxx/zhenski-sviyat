import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MyBooking } from "@/lib/consultations/queries";
import { bookingPriceLabel, paymentModeOf, specialistLabel } from "@/lib/consultations/types";
import { formatDate, formatTime } from "@/lib/locale";

type BookingFactsData = Pick<MyBooking, "starts_at" | "ends_at" | "price_cents" | "payment_method" | "user_note" | "specialist" | "service">;

/** Date, time, specialist, place and price of one booking as a description list. */
export function BookingFacts({ booking }: { booking: BookingFactsData }) {
  const { service, specialist } = booking;
  const mode = service
    ? paymentModeOf({ requiresPrepayment: service.requires_prepayment, allowBankTransfer: service.allow_bank_transfer }, booking.price_cents)
    : booking.price_cents === 0
      ? "free"
      : "bank";
  const price = bookingPriceLabel(booking.price_cents, mode);
  const facts = [
    { term: "Дата", value: <time dateTime={booking.starts_at}>{formatDate(booking.starts_at)}</time> },
    { term: "Час", value: `${formatTime(booking.starts_at)} – ${formatTime(booking.ends_at)}` },
    { term: "Специалист", value: specialist ? specialistLabel({ name: specialist.full_name, title: specialist.title }) : "—" },
    ...(service?.location_info ? [{ term: "Място", value: service.location_info }] : []),
    { term: "Цена", value: booking.payment_method === "bank_transfer" ? `${price} · банков превод` : price },
    ...(booking.user_note ? [{ term: "Бележка", value: booking.user_note }] : []),
  ];
  return (
    <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1.25, width: "100%" }}>
      {facts.map((fact) => (
        <Box key={fact.term} sx={{ display: "contents" }}>
          <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
            {fact.term}
          </Typography>
          <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600, whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
            {fact.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
