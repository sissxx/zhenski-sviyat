import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EventFacts } from "@/components/events/EventFacts";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { getEventBySlug, getMyActiveRegistration } from "@/lib/events/queries";
import { eventLocationLabel, registrationStatusLabels, type PublicEvent } from "@/lib/events/types";
import { formatDate, formatDateTime } from "@/lib/locale";
import { eventConfirmationPath, eventRegistrationPath, routes } from "@/lib/routes";

type EventPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  return event ? { title: event.title, description: event.summary ?? undefined } : {};
}

const eyebrows: Record<PublicEvent["availability"], string> = {
  open: "Предстоящо събитие",
  full: "Предстоящо събитие",
  not_open_yet: "Предстоящо събитие",
  closed: "Предстоящо събитие",
  past: "Отминало събитие",
  cancelled: "Отменено събитие",
};

/** Seats line and why sign-up is unavailable, if it is. */
function availabilityText(event: PublicEvent): { text: string; tone: "error.main" | "text.secondary" } | null {
  switch (event.availability) {
    case "open":
      return event.capacity !== null && event.seatsLeft !== null
        ? { text: `Свободни места: ${event.seatsLeft} от ${event.capacity}`, tone: "text.secondary" }
        : null;
    case "full":
      return { text: "Всички места са заети.", tone: "error.main" };
    case "not_open_yet":
      return {
        text: `Записването започва на ${formatDateTime(event.registrationOpensAt!)}.`,
        tone: "text.secondary",
      };
    case "closed":
      return { text: "Записването за това събитие приключи.", tone: "text.secondary" };
    case "past":
      return { text: "Събитието вече се проведе.", tone: "text.secondary" };
    case "cancelled":
      return { text: "Събитието е отменено.", tone: "error.main" };
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();
  const registration = await getMyActiveRegistration(event.id);
  const note = availabilityText(event);

  return (
    <>
      <PageIntro
        eyebrow={eyebrows[event.availability]}
        title={event.title}
        lead={`${formatDate(event.startsAt)} · ${eventLocationLabel(event)}`}
      />

      <Section bg="brand.mintLight" aria-label="Подробности за събитието">
        <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "8fr 5fr" }, alignItems: "start" }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, minWidth: 0 }}>
            {/* Cover image placeholder from Figma; event photos come later. */}
            <Box sx={{ bgcolor: "brand.sageLight", borderRadius: "14px", px: 2, py: { xs: 4, md: 6 } }}>
              <Typography sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 22, color: "primary.main" }}>
                Срещаме се, за да растем заедно
              </Typography>
            </Box>
            <Typography variant="h4" component="h2" sx={{ color: "primary.main" }}>
              За събитието
            </Typography>
            {(event.description ?? event.summary ?? "")
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((paragraph, index) => (
                <Typography key={index} sx={{ fontSize: 15, whiteSpace: "pre-line" }}>
                  {paragraph}
                </Typography>
              ))}
          </Box>

          <Panel tone="mint" aria-labelledby="booking-title" sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
            <Typography id="booking-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
              {registration ? "Ти си записана" : "Запази своето място"}
            </Typography>
            <EventFacts event={event} />
            {registration ? (
              <>
                <Typography sx={{ fontSize: 14 }}>
                  Статус: <strong>{registrationStatusLabels[registration.status]}</strong>
                </Typography>
                <Button
                  variant="contained"
                  href={`${eventConfirmationPath(event.slug)}?zapisvane=${registration.id}`}
                  sx={{ minWidth: 220 }}
                >
                  {registration.status === "pending_payment" ? "Данни за плащане" : "Виж записването"}
                </Button>
              </>
            ) : (
              <>
                {note && <Typography sx={{ fontSize: 14, color: note.tone }}>{note.text}</Typography>}
                {event.availability === "open" ? (
                  <Button variant="contained" href={eventRegistrationPath(event.slug)} sx={{ minWidth: 220 }}>
                    Запиши се
                  </Button>
                ) : (
                  <Button variant="contained" disabled sx={{ minWidth: 220 }}>
                    {event.availability === "full" ? "Няма свободни места" : "Записването е затворено"}
                  </Button>
                )}
              </>
            )}
            <Button variant="outlined" href={routes.events} sx={{ minWidth: 220 }}>
              Виж всички събития
            </Button>
          </Panel>
        </Box>
      </Section>
    </>
  );
}
