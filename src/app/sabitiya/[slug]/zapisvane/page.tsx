import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { EventFacts } from "@/components/events/EventFacts";
import { EventRegistrationForm } from "@/components/events/EventRegistrationForm";
import { FormAlert } from "@/components/forms/FormAlert";
import { AppLink } from "@/components/ui/AppLink";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/auth/session";
import { getEventBySlug, getMyActiveRegistration } from "@/lib/events/queries";
import { availabilityLabels } from "@/lib/events/types";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { eventConfirmationPath, eventPath, eventRegistrationPath, loginPath, routes } from "@/lib/routes";

type RegistrationPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RegistrationPageProps): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  return event ? { title: `Записване: ${event.title}`, robots: { index: false } } : {};
}

export default async function EventRegistrationPage({ params }: RegistrationPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const paid = event.priceCents > 0;
  const cardAvailable = isStripeConfigured();

  const user = await getCurrentUser();
  const registration = user ? await getMyActiveRegistration(event.id) : null;
  // Already signed up (or mid-payment): show that registration instead of a second form.
  if (registration) redirect(`${eventConfirmationPath(slug)}?zapisvane=${registration.id}`);

  let profile: { first_name: string | null; last_name: string | null; phone: string | null; status: string } | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("first_name, last_name, phone, status").eq("id", user.id).maybeSingle();
    profile = data;
  }

  return (
    <>
      <PageIntro
        eyebrow="Събития"
        title={paid ? "Записване и плащане" : "Записване"}
        lead={
          paid
            ? "Заяви участие с данните от профила си и плати с карта или по банков път."
            : "Запази място с данните от профила си. Участието е безплатно."
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
            {event.availability !== "open" ? (
              <>
                <Typography>
                  {event.availability === "full"
                    ? "Всички места за това събитие са заети."
                    : `${availabilityLabels[event.availability]}. Не можеш да се запишеш за това събитие.`}
                </Typography>
                <Button variant="outlined" href={routes.events}>
                  Виж другите събития
                </Button>
              </>
            ) : !user ? (
              <>
                <Typography>
                  За да се запишеш, влез в профила си. Така ще виждаш записванията и плащанията си на едно място.
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  <Button variant="contained" href={loginPath(eventRegistrationPath(slug))}>
                    Вход
                  </Button>
                  <Button variant="outlined" href={`${routes.register}?next=${encodeURIComponent(eventRegistrationPath(slug))}`}>
                    Създай профил
                  </Button>
                </Box>
              </>
            ) : profile?.status === "suspended" ? (
              <FormAlert severity="warning">
                Профилът ти е временно спрян и не можеш да се записваш за събития. Свържи се с нас за повече информация.
              </FormAlert>
            ) : paid && !event.allowBankTransfer && !cardAvailable ? (
              <>
                <Typography>
                  За това събитие се плаща с карта, а онлайн плащането ще бъде достъпно съвсем скоро. Дотогава можеш да
                  запазиш място, като се свържеш с нас.
                </Typography>
                <Button variant="outlined" href={routes.contacts}>
                  Свържи се с нас
                </Button>
              </>
            ) : (
              <>
                <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1, fontSize: 14 }}>
                  <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>Име</Typography>
                  <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>
                    {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "—"}
                  </Typography>
                  <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>Имейл</Typography>
                  <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}>{user.email}</Typography>
                  <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>Телефон</Typography>
                  <Typography component="dd" sx={{ m: 0, fontSize: 14, fontWeight: 600 }}>{profile?.phone || "—"}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Данните са от профила ти. <AppLink href={routes.accountDetails}>Промени ги</AppLink>, ако нещо не е вярно.
                </Typography>
                <EventRegistrationForm
                  slug={event.slug}
                  priceCents={event.priceCents}
                  cardAvailable={cardAvailable}
                  bankAvailable={event.allowBankTransfer}
                />
              </>
            )}
          </Panel>
        </Box>
      </Section>
    </>
  );
}
