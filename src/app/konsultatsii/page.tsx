import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ConsultationBooking, type BookableService, type BookingViewer } from "@/components/consultations/ConsultationBooking";
import { isStripeConfigured } from "@/lib/stripe/server";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { getCurrentUser } from "@/lib/auth/session";
import { getBookingRules, listConsultationServices } from "@/lib/consultations/queries";
import { bookingPriceLabel, paymentModeOf, servicePriceLabel } from "@/lib/consultations/types";
import { createClient } from "@/lib/supabase/server";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Индивидуални консултации",
  description: "Запиши час за лична или онлайн консултация със специалист: психолог, адвокат, здравна грижа и развитие.",
};

type ConsultationsPageProps = { searchParams: Promise<{ usluga?: string | string[]; spetsialist?: string | string[] }> };

const hours = (n: number) => (n === 1 ? "1 час" : `${n} часа`);

async function viewerOf(): Promise<BookingViewer> {
  const user = await getCurrentUser();
  if (!user) return { kind: "guest" };
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("first_name, last_name, phone, status").eq("id", user.id).maybeSingle();
  if (profile?.status === "suspended") return { kind: "suspended" };
  return {
    kind: "user",
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    email: user.email ?? "",
    phone: profile?.phone ?? null,
  };
}

export default async function ConsultationsPage({ searchParams }: ConsultationsPageProps) {
  const { usluga, spetsialist } = await searchParams;
  const [allServices, rules, viewer] = await Promise.all([listConsultationServices(), getBookingRules(), viewerOf()]);
  const services: BookableService[] = allServices
    .filter((s) => s.specialists.length > 0)
    .map((s) => ({
      ...s,
      priceLabel: servicePriceLabel(s),
      specialists: s.specialists.map((sp) => ({ ...sp, priceLabel: bookingPriceLabel(sp.priceCents, paymentModeOf(s, sp.priceCents)) })),
    }));

  return (
    <>
      <PageIntro
        eyebrow="Индивидуални консултации"
        title="Записване за лична или онлайн консултация."
        lead="Лични и онлайн консултации със специалист — избери направление и свободен час, който ти е удобен."
      />

      <Section bg="background.paper" aria-label="Записване на час">
        <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "4fr 6fr" }, alignItems: "start" }}>
          <Panel tone="mint" aria-labelledby="help-title" sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
            <Typography id="help-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Как можем да помогнем?
            </Typography>
            {services.length > 0 && (
              <Typography sx={{ fontSize: 14 }}>Направления: {services.map((s) => s.name).join(", ")}.</Typography>
            )}
            <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: 14, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <li>Избираш направление, специалист и свободен час.</li>
              <li>Потвърждаваш с профила си. Платените консултации плащаш с карта или по банков път.</li>
              <li>Часът се вижда в „Моят профил“ → „Моите консултации“, откъдето можеш да го преместиш или откажеш.</li>
            </Box>
            <Typography variant="h6" component="h3" sx={{ color: "primary.main", mt: 1 }}>
              Правила
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <li>
                Часове се запазват най-малко {hours(rules.minNoticeHours)} предварително и до {rules.maxAdvanceDays} дни напред.
              </li>
              <li>
                Можеш да откажеш или преместиш час до {hours(rules.cancelDeadlineHours)} преди началото
                {rules.maxReschedules > 0 ? ` (до ${rules.maxReschedules} премествания).` : "."} Неплатена заявка можеш да
                откажеш по всяко време.
              </li>
              <li>
                При плащане с карта часът се потвърждава веднага. При банков превод часът се пази, докато преводът
                пристигне и екипът го потвърди.
              </li>
            </Box>
          </Panel>

          <Panel aria-labelledby="booking-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2.5 }}>
            <Typography id="booking-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Заяви консултация
            </Typography>
            {services.length === 0 ? (
              <>
                <Typography>
                  Скоро тук ще можеш да запазваш час онлайн. Дотогава ни пиши и ще намерим удобно време за теб.
                </Typography>
                <Button variant="outlined" href={routes.contacts} sx={{ alignSelf: "flex-start" }}>
                  Свържи се с нас
                </Button>
              </>
            ) : (
              <ConsultationBooking
                services={services}
                viewer={viewer}
                cardAvailable={isStripeConfigured()}
                initialServiceSlug={typeof usluga === "string" ? usluga : undefined}
                initialSpecialistSlug={typeof spetsialist === "string" ? spetsialist : undefined}
              />
            )}
          </Panel>
        </Box>
      </Section>
    </>
  );
}
