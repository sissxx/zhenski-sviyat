import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EventFacts } from "@/components/events/EventFacts";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { AppLink } from "@/components/ui/AppLink";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { events, findEvent } from "@/content/events";
import { eventPath, routes } from "@/lib/routes";

type RegistrationPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: RegistrationPageProps): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return event ? { title: `Записване: ${event.title}`, robots: { index: false } } : {};
}

export default async function EventRegistrationPage({ params }: RegistrationPageProps) {
  const event = findEvent((await params).slug);
  if (!event) notFound();
  const paid = event.priceCents > 0;
  const soldOut = event.spotsLeft === 0;

  return (
    <>
      <PageIntro
        eyebrow="Събития"
        title={paid ? "Записване и плащане" : "Записване"}
        lead={
          paid
            ? "Попълни данните си, за да заявиш участие. Можеш да платиш с карта или по банков път."
            : "Попълни данните си, за да запазиш място. Участието е безплатно."
        }
      />

      <Section bg="background.paper" aria-label="Записване за събитие">
        <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }, alignItems: "start" }}>
          <Panel tone="mint" aria-labelledby="summary-title" sx={{ borderColor: "transparent" }}>
            <Typography id="summary-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
              Твоето събитие
            </Typography>
            <Typography variant="h6" component="p" sx={{ color: "primary.main" }}>
              <AppLink href={eventPath(event.slug)} sx={{ color: "inherit" }}>
                {event.title}
              </AppLink>
            </Typography>
            <EventFacts event={event} />
          </Panel>

          <Panel aria-labelledby="form-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2.25 }}>
            <Typography id="form-title" variant="h5" component="h2" sx={{ color: "primary.main" }}>
              Данни за записване
            </Typography>
            {soldOut ? (
              <>
                <Typography>Всички места за това събитие са заети.</Typography>
                <Button variant="outlined" href={routes.events}>
                  Виж другите събития
                </Button>
              </>
            ) : (
              <EventRegistrationForm slug={event.slug} paid={paid} />
            )}
          </Panel>
        </Box>
      </Section>
    </>
  );
}
