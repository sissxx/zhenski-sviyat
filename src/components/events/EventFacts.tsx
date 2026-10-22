import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { eventLocationLabel, eventPriceLabel, type EventFormat } from "@/lib/events/types";
import { formatDate, formatTime } from "@/lib/locale";

export type EventFactsData = {
  startsAt: string;
  endsAt?: string | null;
  format: EventFormat;
  city: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  priceCents: number;
};

function placeLabel(event: EventFactsData): string {
  if (event.format === "online") return "Онлайн · линкът се вижда в профила ти след потвърждение";
  const venue = [event.venueName, event.venueAddress].filter(Boolean).join(", ");
  return `${eventLocationLabel(event)} · ${venue || "адресът предстои"}`;
}

/** Date, time, place and fee as a description list (booking panel and checkout summary). */
export function EventFacts({ event }: { event: EventFactsData }) {
  const time = event.endsAt ? `${formatTime(event.startsAt)} – ${formatTime(event.endsAt)}` : formatTime(event.startsAt);
  const facts = [
    { term: "Дата", value: <time dateTime={event.startsAt}>{formatDate(event.startsAt)}</time> },
    { term: "Час", value: time },
    { term: "Място", value: placeLabel(event) },
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
