import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { formatPrice } from "@/lib/locale";
import { joinPlanPath } from "@/lib/routes";
import { perInterval, type PublicPlan } from "@/lib/subscriptions/plans";

type PlanDetailsProps = {
  plan: PublicPlan;
  heading: string;
  intro?: ReactNode;
  bg: string;
};

/** Benefits on the left, price and sign-up on the right (Figma frames 12:288 and 12:333). */
export function PlanDetails({ plan, heading, intro, bg }: PlanDetailsProps) {
  const every = plan.billingInterval === "year" ? "всяка година" : "всеки месец";
  return (
    <Section bg={bg} aria-label={plan.name}>
      <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "11fr 9fr" }, alignItems: "start" }}>
        <Panel tone="mint" sx={{ gap: 1.75 }}>
          <Typography variant="h4" component="h2" sx={{ color: "primary.main" }}>
            {heading}
          </Typography>
          {intro && <Typography sx={{ fontSize: 14 }}>{intro}</Typography>}
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.25 }}>
            {plan.features.map((benefit) => (
              <Box component="li" key={benefit} sx={{ display: "flex", gap: 1.25, fontSize: 14 }}>
                <Box component="span" aria-hidden sx={{ width: 24, flexShrink: 0, fontWeight: 600, color: "brand.terracotta" }}>
                  ✓
                </Box>
                {benefit}
              </Box>
            ))}
          </Box>
        </Panel>

        <Panel aria-labelledby={`${plan.slug}-price`} sx={{ gap: 1.5 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{plan.billingInterval === "year" ? "Годишен абонамент" : "Месечен абонамент"}</Typography>
          <Typography id={`${plan.slug}-price`} sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 40, lineHeight: 1.2, color: "brand.terracotta" }}>
            {formatPrice(plan.priceCents)}
            <Typography component="span" sx={{ fontSize: 14, color: "text.secondary", ml: 1 }}>
              / {perInterval(plan.billingInterval)}
            </Typography>
          </Typography>
          {plan.priceProvisional && <Placeholder label="Цена">Окончателната цена предстои да бъде потвърдена.</Placeholder>}

          <Box component="dl" sx={{ m: 0, display: "grid", gap: 1, width: "100%" }}>
            <PaymentOption term="С карта" text={`Плащаш онлайн, абонаментът се подновява автоматично ${every}.`} />
            {plan.allowBankTransfer && (
              <PaymentOption term="По банков път" text={`Превеждаш таксата ${every}. Достъпът се активира, щом екипът потвърди плащането.`} />
            )}
          </Box>

          <Button variant="contained" color="secondary" href={joinPlanPath(plan.slug)} sx={{ minWidth: 220 }}>
            Стани член
          </Button>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Линкът към Viber групата се появява в профила ти, след като членството бъде активирано. Можеш да го прекратиш по
            всяко време.
          </Typography>
        </Panel>
      </Box>
    </Section>
  );
}

function PaymentOption({ term, text }: { term: string; text: string }) {
  return (
    <Box sx={{ bgcolor: "brand.card", border: "1px solid", borderColor: "divider", borderRadius: "10px", p: 1.5 }}>
      <Typography component="dt" sx={{ fontWeight: 600, fontSize: 14 }}>
        {term}
      </Typography>
      <Typography component="dd" sx={{ m: 0, fontSize: 14, color: "text.secondary" }}>
        {text}
      </Typography>
    </Box>
  );
}
