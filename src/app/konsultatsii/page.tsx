import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ConsultationBooking } from "@/components/consultations/ConsultationBooking";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { buildConsultationSlots, consultationTypes, specialists } from "@/content/consultations";
import { formatPrice } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Индивидуални консултации",
  description: "Запиши час за лична или онлайн консултация със специалист: психолог, адвокат, здравна грижа и развитие.",
};

// Mock slots are built relative to today; rebuild hourly so past slots drop off.
export const revalidate = 3600;

export default function ConsultationsPage() {
  const slots = buildConsultationSlots();
  const types = consultationTypes.map((type) => ({ ...type, priceLabel: formatPrice(type.priceCents) }));
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
            <Typography sx={{ fontSize: 14 }}>
              Направления: психологическа подкрепа, юридическа подкрепа, личностно и кариерно развитие, управление на стреса
              и здравна грижа.
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.5, fontSize: 14, display: "flex", flexDirection: "column", gap: 0.75 }}>
              <li>Избираш направление, специалист и свободен час.</li>
              <li>Получаваш потвърждение по имейл с подробностите.</li>
              <li>За онлайн консултация получаваш линк за видеовръзка.</li>
            </Box>
            <Placeholder>
              Цените, работното време на специалистите и правилата за плащане и отказ ще бъдат уточнени.
            </Placeholder>
          </Panel>

          <Panel aria-labelledby="booking-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2.5 }}>
            <Typography id="booking-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Заяви консултация
            </Typography>
            <ConsultationBooking types={types} specialists={specialists} slots={slots} />
          </Panel>
        </Box>
      </Section>
    </>
  );
}
