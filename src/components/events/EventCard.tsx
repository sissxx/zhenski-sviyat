import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { eventHref, eventLocationLabel, type SiteEvent } from "@/content/events";
import { formatDate, formatDayMonthBadge, formatPrice } from "@/lib/locale";

export const eventPriceLabel = (event: SiteEvent) => (event.priceCents === 0 ? "Безплатно" : formatPrice(event.priceCents));

/** Event card from the Figma events list (frame 8:664). */
export function EventCard({ event }: { event: SiteEvent }) {
  const soldOut = event.spotsLeft === 0;
  return (
    <Box
      component="article"
      sx={{
        height: "100%",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "14px",
        p: 2.75,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 1.5,
      }}
    >
      {/* Image placeholder band from Figma; event photos come later. */}
      <Box sx={{ width: "100%", bgcolor: "brand.mint", p: 1.5, display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Typography component="time" dateTime={event.startsAt} title={formatDate(event.startsAt)} sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
          {formatDayMonthBadge(event.startsAt)}
        </Typography>
        <Typography sx={{ fontWeight: 600, fontSize: 13, color: soldOut ? "text.secondary" : "brand.accent" }}>
          {soldOut ? "Няма места" : eventPriceLabel(event)}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: 14, color: "brand.accent" }}>{eventLocationLabel(event)}</Typography>
      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        {event.title}
      </Typography>
      <Typography sx={{ fontSize: 14, flexGrow: 1 }}>{event.summary}</Typography>
      <Button variant="contained" href={eventHref(event)} aria-label={`Виж събитието: ${event.title}`} sx={{ minWidth: 220 }}>
        Виж събитието
      </Button>
    </Box>
  );
}
