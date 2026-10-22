import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { eventLocationLabel, type SiteEvent } from "@/content/events";
import { formatDate, formatTime } from "@/lib/locale";
import { eventPriceLabel } from "./EventCard";

/** Date, time, place and fee as a description list (booking panel and checkout summary). */
export function EventFacts({ event }: { event: SiteEvent }) {
  const place =
    event.format === "online"
      ? "Онлайн · линкът се изпраща по имейл"
      : `${eventLocationLabel(event)} · ${event.address ?? "адресът предстои"}`;
  const facts = [
    { term: "Дата", value: <time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time> },
    { term: "Час", value: formatTime(event.startsAt) },
    { term: "Място", value: place },
    { term: "Такса", value: eventPriceLabel(event) },
  ];
  return (
    <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1.25, width: "100%" }}>
      {facts.map((fact) => (
        <Box key={fact.term} sx={{ display: "contents" }}>
          <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
            {fact.term}
          </Typography>
          <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>
            {fact.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
