import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EventFacts } from "@/components/events/EventFacts";
import { NotConnectedNotice } from "@/components/forms/NotConnectedNotice";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { findEvent } from "@/content/events";
import { formatPrice } from "@/lib/locale";
import { routes } from "@/lib/routes";

type ConfirmationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plashtane?: string | string[] }>;
};

export const metadata: Metadata = { title: "Потвърждение за записване", robots: { index: false } };

const outcomes = {
  free: {
    title: "Мястото ти е запазено",
    text: "Изпратихме потвърждение на имейла ти. Ще получиш напомняне ден преди събитието.",
  },
  card: {
    title: "Плащането е успешно",
    text: "Изпратихме потвърждение и разписка на имейла ти. Записването се вижда и в профила ти.",
  },
  bank: {
    title: "Заявката чака плащане",
    text: "Мястото ти се потвърждава, щом преводът пристигне и екипът го отбележи. Ще получиш имейл, когато това стане.",
  },
} as const;

type Outcome = keyof typeof outcomes;

export default async function EventConfirmationPage({ params, searchParams }: ConfirmationPageProps) {
  const event = findEvent((await params).slug);
  if (!event) notFound();
  const { plashtane } = await searchParams;
  const outcome: Outcome = event.priceCents === 0 ? "free" : plashtane === "bank" ? "bank" : "card";
  const { title, text } = outcomes[outcome];

  return (
    <>
      <PageIntro eyebrow="Събития" title="Благодарим за заявката!" lead={`${event.title} — ${title.toLocaleLowerCase("bg-BG")}.`} />

      <Section bg="brand.mintLight" aria-labelledby="outcome-title">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25, maxWidth: 820 }}>
          <Box
            aria-hidden
            sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: outcome === "bank" ? "brand.accent" : "primary.main", color: "brand.paper", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 600 }}
          >
            {outcome === "bank" ? "…" : "✓"}
          </Box>
          <Typography id="outcome-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
            {title}
          </Typography>
          <Typography>{text}</Typography>

          {outcome === "bank" && (
            <Panel aria-labelledby="bank-title" sx={{ width: "100%" }}>
              <Typography id="bank-title" variant="h6" component="h3">
                Данни за банков превод
              </Typography>
              <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, columnGap: 2, rowGap: 0.75, fontSize: 14 }}>
                <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>Сума</Typography>
                <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>{formatPrice(event.priceCents)}</Typography>
                <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>Основание</Typography>
                <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>Номерът на заявката от имейла ти</Typography>
              </Box>
              <Placeholder>Получател, IBAN и BIC на сдружението.</Placeholder>
            </Panel>
          )}

          <Panel tone="card" aria-label="Подробности" sx={{ width: "100%" }}>
            <Typography variant="h6" component="h3">
              {event.title}
            </Typography>
            <EventFacts event={event} />
          </Panel>

          <NotConnectedNotice>
            Това е демонстрация: записването и плащанията все още не са свързани, затова заявка не е изпратена и имейл не е
            получен.
          </NotConnectedNotice>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, width: "100%" }}>
            <Button variant="contained" href={routes.events}>
              Към всички събития
            </Button>
            <Button variant="outlined" href={routes.home}>
              Начална страница
            </Button>
          </Box>
        </Box>
      </Section>
    </>
  );
}
