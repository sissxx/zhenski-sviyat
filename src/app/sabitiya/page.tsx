import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { EventCard } from "@/components/events/EventCard";
import { EventList } from "@/components/events/EventList";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { listPastEvents, listUpcomingEvents } from "@/lib/events/queries";

export const metadata: Metadata = {
  title: "Събития",
  description: "Работилници, разговори и срещи с експерти — на живо и онлайн. Запиши се за предстоящите събития.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([listUpcomingEvents(), listPastEvents()]);
  return (
    <>
      <PageIntro
        eyebrow="Срещи и преживявания"
        title="Събития, които ни събират"
        lead="Работилници, разговори и срещи с експерти — на живо и онлайн, с място за всяка жена."
      />
      <EventList
        items={upcoming.map((event) => ({
          slug: event.slug,
          format: event.format,
          card: <EventCard event={event} />,
        }))}
      />
      {past.length > 0 && (
        <Section bg="background.default" aria-labelledby="past-events-title">
          <Typography id="past-events-title" variant="h4" component="h2" sx={{ color: "primary.main", mb: 2.5 }}>
            Отминали събития
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
            {past.map((event) => (
              <li key={event.slug}>
                <EventCard event={event} />
              </li>
            ))}
          </Box>
        </Section>
      )}
    </>
  );
}
