import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { z } from "zod";
import { BookingFacts } from "@/components/consultations/BookingFacts";
import { BankTransferDetails } from "@/components/events/BankTransferDetails";
import { CardPaymentButton } from "@/components/payments/CardPaymentButton";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyBooking } from "@/lib/consultations/queries";
import { getBankDetails } from "@/lib/events/queries";
import { consultationConfirmationPath, loginPath, routes } from "@/lib/routes";
import { formatDateTime } from "@/lib/locale";
import { syncReturnedCheckout } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/server";

type ConfirmationPageProps = {
  searchParams: Promise<{ zapis?: string | string[]; session_id?: string | string[]; plashtane?: string | string[] }>;
};

export const metadata: Metadata = { title: "Потвърждение за консултация", robots: { index: false } };

type Outcome = "confirmed" | "bank" | "card" | "ended";

const outcomes: Record<Outcome, { title: string; text: string }> = {
  confirmed: {
    title: "Часът ти е запазен",
    text: "Консултацията е потвърдена. Виждаш я и в профила си, в „Моите консултации“, откъдето можеш да я преместиш или откажеш.",
  },
  bank: {
    title: "Заявката чака плащане",
    text: "Часът ти е запазен временно. Потвърждаваме го, щом преводът пристигне и екипът го отбележи.",
  },
  card: {
    title: "Плащането не е завършено",
    text: "Часът ти е запазен временно. Довърши плащането с карта, за да го потвърдим.",
  },
  ended: {
    title: "Заявката не е активна",
    text: "Тази консултация е отказана или срокът за плащане е изтекъл. Можеш да запазиш нов час.",
  },
};

export default async function ConsultationConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { zapis, session_id: sessionId, plashtane } = await searchParams;
  const bookingId = typeof zapis === "string" && z.uuid().safeParse(zapis).success ? zapis : null;
  if (!bookingId) redirect(routes.consultations);

  const user = await getCurrentUser();
  if (!user) redirect(loginPath(consultationConfirmationPath(bookingId)));

  // Back from Stripe Checkout: ask Stripe and record the payment now instead of waiting for the webhook.
  if (typeof sessionId === "string" && isStripeConfigured()) await syncReturnedCheckout(sessionId, user.id);
  const booking = await getMyBooking(bookingId);
  if (!booking) redirect(routes.consultations);

  const outcome: Outcome =
    booking.status === "pending_payment"
      ? booking.payment?.provider === "stripe"
        ? "card"
        : "bank"
      : booking.status === "confirmed" || booking.status === "completed" ? "confirmed" : "ended";
  const { title } = outcomes[outcome];
  const text =
    outcome === "card" && typeof sessionId === "string"
      ? "Плащането се обработва. Обнови страницата след малко; ако не се потвърди, опитай отново."
      : outcome === "card" && plashtane === "prekasnato"
        ? "Плащането беше прекъснато и нищо не е таксувано. Часът ти се пази още малко, ако искаш да опиташ отново."
        : outcomes[outcome].text;
  const bank = outcome === "bank" ? await getBankDetails() : null;

  return (
    <>
      <PageIntro
        eyebrow="Индивидуални консултации"
        title={outcome === "ended" ? "Консултация" : "Благодарим за заявката!"}
        lead={`${booking.service?.name ?? "Консултация"} — ${title.toLocaleLowerCase("bg-BG")}.`}
      />

      <Section bg="brand.mintLight" aria-labelledby="outcome-title">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, maxWidth: 820 }}>
          <Box
            aria-hidden
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: outcome === "confirmed" ? "primary.main" : "brand.accent",
              color: "brand.paper",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {outcome === "bank" || outcome === "card" ? "…" : outcome === "ended" ? "!" : "✓"}
          </Box>
          <Typography id="outcome-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
            {title}
          </Typography>
          <Typography>{text}</Typography>

          {outcome === "bank" && booking.payment && (
            <BankTransferDetails
              amountCents={booking.payment.amount_cents}
              reference={booking.payment.bank_reference}
              deadline={booking.hold_expires_at}
              bank={bank}
              subject="часът"
            />
          )}

          {outcome === "card" && booking.payment && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <CardPaymentButton paymentId={booking.payment.id} />
              {booking.hold_expires_at && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Часът се пази до {formatDateTime(booking.hold_expires_at)}.
                </Typography>
              )}
            </Box>
          )}

          <Panel tone="card" aria-label="Подробности" sx={{ width: "100%" }}>
            <Typography variant="h6" component="h3">
              {booking.service?.name ?? "Консултация"}
            </Typography>
            <BookingFacts booking={booking} />
          </Panel>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, width: "100%" }}>
            <Button variant="contained" href={routes.accountConsultations}>
              Моите консултации
            </Button>
            <Button variant="outlined" href={routes.consultations}>
              Към консултациите
            </Button>
          </Box>
        </Box>
      </Section>
    </>
  );
}
