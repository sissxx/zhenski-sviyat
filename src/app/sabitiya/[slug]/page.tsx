import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EventFacts } from "@/components/events/EventFacts";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { eventCategories, eventLocationLabel, events, findEvent } from "@/content/events";
import { formatDate } from "@/lib/locale";
import { eventRegistrationPath, routes } from "@/lib/routes";

type EventPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return event ? { title: event.title, description: event.summary } : {};
}

export default async function EventPage({ params }: EventPageProps) {
  const event = findEvent((await params).slug);
  if (!event) notFound();
  const soldOut = event.spotsLeft === 0;

  return (
    <>
      <PageIntro
        eyebrow={`Предстоящо събитие · ${eventCategories[event.category]}`}
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
            <Typography sx={{ fontSize: 15 }}>{event.description}</Typography>
            <Placeholder>Програмата и водещите ще бъдат уточнени.</Placeholder>
          </Box>

          <Panel tone="mint" aria-labelledby="booking-title" sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
            <Typography id="booking-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
              Запази своето място
            </Typography>
            <EventFacts event={event} />
            <Typography sx={{ fontSize: 13, color: soldOut ? "error.main" : "text.secondary" }}>
              {soldOut ? "Няма свободни места." : `Свободни места: ${event.spotsLeft} от ${event.capacity}`}
            </Typography>
            {soldOut ? (
              <Button variant="contained" disabled sx={{ minWidth: 220 }}>
                Няма свободни места
              </Button>
            ) : (
              <Button variant="contained" href={eventRegistrationPath(event.slug)} sx={{ minWidth: 220 }}>
                Запиши се
              </Button>
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
