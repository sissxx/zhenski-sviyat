"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import type { EventFormat } from "@/lib/events/types";
import { routes } from "@/lib/routes";

type Filter = "all" | "in_person" | "online";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Всички" },
  { value: "in_person", label: "На живо" },
  { value: "online", label: "Онлайн" },
];

/** A card rendered on the server (so dates and prices are formatted once) plus what the filter needs. */
export type EventListItem = { slug: string; format: EventFormat; card: ReactNode };

// Hybrid events count as both.
const matches = (item: EventListItem, filter: Filter) =>
  filter === "all" || item.format === filter || item.format === "hybrid";

/** Filter buttons and the event grid (Figma frame 8:664). */
export function EventList({ items }: { items: EventListItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = items.filter((item) => matches(item, filter));
  if (items.length === 0) return <NoEvents />;

  return (
    <>
      <Section bg="background.default" sx={{ py: { xs: 3, md: 4.5 } }} aria-label="Филтър на събитията">
        <Box role="group" aria-label="Покажи събития" sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <Button
                key={item.value}
                variant={active ? "contained" : "text"}
                aria-pressed={active}
                onClick={() => setFilter(item.value)}
                sx={{
                  minWidth: { xs: 0, md: 148 },
                  flex: { xs: "1 1 auto", md: "0 0 auto" },
                  fontWeight: 500,
                  ...(!active && { bgcolor: "background.paper", "&:hover": { bgcolor: "brand.mint" } }),
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Section>

      <Section bg="background.paper" aria-label="Предстоящи събития">
        <Typography role="status" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
          {`Показани събития: ${visible.length}`}
        </Typography>
        {visible.length > 0 ? (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
            {visible.map((item) => (
              <li key={item.slug}>{item.card}</li>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 6, px: 2, border: "1px dashed", borderColor: "brand.cardBorder", borderRadius: "14px" }}>
            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
              Няма предстоящи събития от този вид
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 2.5 }}>
              Разгледай всички събития или се абонирай за новини, за да научиш първа за новите.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5 }}>
              <Button variant="outlined" onClick={() => setFilter("all")}>
                Покажи всички
              </Button>
              <Button variant="text" href={routes.consultations}>
                Заяви консултация
              </Button>
            </Box>
          </Box>
        )}
      </Section>
    </>
  );
}

/** Nothing scheduled at all. */
function NoEvents() {
  return (
    <Section bg="background.paper" aria-label="Предстоящи събития">
      <Box sx={{ textAlign: "center", py: 6, px: 2, border: "1px dashed", borderColor: "brand.cardBorder", borderRadius: "14px" }}>
        <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
          В момента няма обявени събития
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 2.5 }}>
          Подготвяме следващите срещи. Абонирай се за новини, за да научиш първа, или заяви индивидуална консултация.
        </Typography>
        <Button variant="outlined" href={routes.consultations}>
          Заяви консултация
        </Button>
      </Box>
    </Section>
  );
}
