import type { Metadata } from "next";
import Box from "@mui/material/Box";
import { EventCard } from "@/components/events/EventCard";
import { EventList } from "@/components/events/EventList";
import { PageIntro } from "@/components/ui/PageIntro";
import { Placeholder } from "@/components/ui/Placeholder";
import { events } from "@/content/events";

export const metadata: Metadata = {
  title: "Събития",
  description: "Работилници, разговори и срещи с експерти — на живо и онлайн. Запиши се за предстоящите събития.",
};

export default function EventsPage() {
  const upcoming = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <>
      <PageIntro
        eyebrow="Срещи и преживявания"
        title="Събития, които ни събират"
        lead="Работилници, разговори и срещи с експерти — на живо и онлайн, с място за всяка жена."
      >
        <Box sx={{ mt: 2 }}>
          <Placeholder label="Примерни данни">Събитията, цените и адресите са примерни, докато екипът не добави истинските.</Placeholder>
        </Box>
      </PageIntro>
      <EventList
        items={upcoming.map((event) => ({
          slug: event.slug,
          category: event.category,
          format: event.format,
          card: <EventCard event={event} />,
        }))}
      />
    </>
  );
}
