import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { listUpcomingEvents } from "@/lib/events/queries";
import { eventLocationLabel } from "@/lib/events/types";
import { formatDate, formatDayMonthBadge } from "@/lib/locale";
import { eventPath, routes } from "@/lib/routes";

/** The next three events on the homepage. */
export async function Events() {
  const events = await listUpcomingEvents(3);
  return (
    <Section bg="background.paper" aria-labelledby="events-title">
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Typography id="events-title" variant="h3" component="h2">
          Събития, които ни събират
        </Typography>
        <Button variant="outlined" href={routes.events}>
          Виж всички събития
        </Button>
      </Box>
      {events.length === 0 && (
        <Panel tone="card" sx={{ p: { xs: 2.5, md: 3 } }}>
          <Typography sx={{ color: "text.secondary" }}>
            Подготвяме следващите срещи. Скоро ще ги обявим тук.
          </Typography>
          <Typography>Дотогава можеш да запишеш час при специалист или да се включиш в някоя от общностите ни.</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button variant="contained" href={routes.consultations}>
              Заяви консултация
            </Button>
            <Button variant="outlined" href={routes.community}>
              Виж общностите
            </Button>
          </Box>
        </Panel>
      )}
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
        {events.map((event) => (
          <Box
            component="li"
            key={event.slug}
            sx={{ bgcolor: "brand.card", border: "1px solid", borderColor: "brand.cardBorder", borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* Image placeholder band from Figma; event photos come later. */}
            <Box sx={{ bgcolor: "brand.sage", p: 1.75, textAlign: "center" }}>
              <Typography component="time" dateTime={event.startsAt} title={formatDate(event.startsAt)} sx={{ fontWeight: 600, fontSize: 14, color: "brand.dark" }}>
                {formatDayMonthBadge(event.startsAt)}
              </Typography>
            </Box>
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.125, flexGrow: 1 }}>
              <Typography variant="h6" component="h3">
                {event.title}
              </Typography>
              <Typography variant="body2">{event.summary}</Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", flexGrow: 1 }}>
                <Box component="span" aria-hidden sx={{ mr: 0.75 }}>
                  ⌖
                </Box>
                {eventLocationLabel(event)}
              </Typography>
              <Button variant="outlined" href={eventPath(event.slug)} aria-label={`Виж събитието: ${event.title}`}>
                Виж събитието
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
