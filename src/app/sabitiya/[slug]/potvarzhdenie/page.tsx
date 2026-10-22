import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { z } from "zod";
import { EventFacts } from "@/components/events/EventFacts";
import { BankTransferDetails } from "@/components/events/BankTransferDetails";
import { CardPaymentButton } from "@/components/payments/CardPaymentButton";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getBankDetails,
  getEventBySlug,
  getMyActiveRegistration,
  getMyRegistration,
  getPrivateEventDetails,
} from "@/lib/events/queries";
import { eventConfirmationPath, eventPath, loginPath, routes } from "@/lib/routes";
import { formatDateTime } from "@/lib/locale";
import { syncReturnedCheckout } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe/server";

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ zapisvane?: string | string[]; session_id?: string | string[]; plashtane?: string | string[] }>;
};

export const metadata: Metadata = { title: "Потвърждение за записване", robots: { index: false } };

type Outcome = "free" | "paid" | "bank" | "card" | "ended";

const outcomes: Record<Outcome, { title: string; text: string }> = {
  free: {
    title: "Мястото ти е запазено",
    text: "Записването е потвърдено. Виждаш го и в профила си, в „Моите събития“.",
  },
  paid: {
    title: "Плащането е потвърдено",
    text: "Получихме плащането и мястото ти е запазено. Записването се вижда в профила ти.",
  },
  bank: {
    title: "Заявката чака плащане",
    text: "Мястото ти е запазено временно. Потвърждаваме го, щом преводът пристигне и екипът го отбележи.",
  },
  card: {
    title: "Плащането не е завършено",
    text: "Мястото ти е запазено временно. Довърши плащането с карта, за да го потвърдим.",
  },
  ended: {
    title: "Записването не е активно",
    text: "Това записване е отказано или срокът за плащане е изтекъл. Можеш да се запишеш отново, ако има свободни места.",
  },
};

export default async function EventConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const { slug } = await params;
  const { zapisvane, session_id: sessionId, plashtane } = await searchParams;
  const registrationId = typeof zapisvane === "string" && z.uuid().safeParse(zapisvane).success ? zapisvane : null;

  const user = await getCurrentUser();
  if (!user) {
    const here = registrationId ? `${eventConfirmationPath(slug)}?zapisvane=${registrationId}` : eventConfirmationPath(slug);
    redirect(loginPath(here));
  }

  const event = await getEventBySlug(slug);
  if (!event) notFound();
  // Back from Stripe Checkout: ask Stripe and record the payment now instead of waiting for the webhook.
  if (typeof sessionId === "string" && isStripeConfigured()) await syncReturnedCheckout(sessionId, user.id);
  const registration = registrationId ? await getMyRegistration(registrationId) : await getMyActiveRegistration(event.id);
  if (!registration || registration.event?.id !== event.id) redirect(eventPath(slug));

  const payment = registration.payment;
  const outcome: Outcome =
    registration.status === "confirmed"
      ? registration.price_cents > 0
        ? "paid"
        : "free"
      : registration.status === "pending_payment"
        ? payment?.provider === "stripe"
          ? "card"
          : "bank"
        : "ended";
  const { title } = outcomes[outcome];
  const text =
    outcome === "card" && typeof sessionId === "string"
      ? "Плащането се обработва. Обнови страницата след малко; ако не се потвърди, опитай отново."
      : outcome === "card" && plashtane === "prekasnato"
        ? "Плащането беше прекъснато и нищо не е таксувано. Мястото ти се пази още малко, ако искаш да опиташ отново."
        : outcomes[outcome].text;
  const [bank, privateDetails] = await Promise.all([
    outcome === "bank" ? getBankDetails() : null,
    registration.status === "confirmed" ? getPrivateEventDetails(event.id) : null,
  ]);

  return (
    <>
      <PageIntro
        eyebrow="Събития"
        title={outcome === "ended" ? event.title : "Благодарим за заявката!"}
        lead={`${event.title} — ${title.toLocaleLowerCase("bg-BG")}.`}
      />

      <Section bg="brand.mintLight" aria-labelledby="outcome-title">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, maxWidth: 820 }}>
          <Box
            aria-hidden
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: outcome === "bank" || outcome === "card" || outcome === "ended" ? "brand.accent" : "primary.main",
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

          {outcome === "bank" && payment && (
            <BankTransferDetails
              amountCents={payment.amount_cents}
              reference={payment.bank_reference}
              deadline={registration.hold_expires_at}
              bank={bank}
            />
          )}

          {outcome === "card" && payment && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <CardPaymentButton paymentId={payment.id} />
              {registration.hold_expires_at && (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Мястото се пази до {formatDateTime(registration.hold_expires_at)}.
                </Typography>
              )}
            </Box>
          )}

          {privateDetails && (privateDetails.online_url || privateDetails.attendee_instructions) && (
            <Panel aria-labelledby="private-title" sx={{ width: "100%" }}>
              <Typography id="private-title" variant="h6" component="h3">
                За участниците
              </Typography>
              {privateDetails.online_url && (
                <Typography sx={{ fontSize: 14 }}>
                  Линк за участие:{" "}
                  <Link href={privateDetails.online_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: "anywhere" }}>
                    {privateDetails.online_url}
                  </Link>
                </Typography>
              )}
              {privateDetails.attendee_instructions && (
                <Typography sx={{ fontSize: 14, whiteSpace: "pre-line" }}>{privateDetails.attendee_instructions}</Typography>
              )}
            </Panel>
          )}

          <Panel tone="card" aria-label="Подробности" sx={{ width: "100%" }}>
            <Typography variant="h6" component="h3">
              {event.title}
            </Typography>
            <EventFacts event={event} />
          </Panel>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, width: "100%" }}>
            <Button variant="contained" href={routes.accountEvents}>
              Моите събития
            </Button>
            <Button variant="outlined" href={routes.events}>
              Към всички събития
            </Button>
          </Box>
        </Box>
      </Section>
    </>
  );
}
