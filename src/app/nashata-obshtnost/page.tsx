import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { communityAreas } from "@/content/community";
import { membershipPlans } from "@/content/plans";
import { formatPrice } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("community");

const plans = [
  { plan: membershipPlans.beautyClub, text: "Затворена Viber група с месечен абонамент." },
  { plan: membershipPlans.viber, text: "Месечен абонамент за участие в общността." },
];

export default function CommunityPage() {
  const cards = [
    ...communityAreas,
    ...plans.map(({ plan, text }, index) => ({
      title: plan.title,
      text,
      cta: { label: `Членство · ${formatPrice(plan.priceCents)}`, href: plan.href },
      primary: index === 0,
    })),
  ];

  return (
    <>
      <PageIntro
        eyebrow="Нашата общност"
        title="Дейности и услуги"
        lead="Място за споделяне на опит, професионални насоки и подкрепа — присъствено и онлайн."
      />

      <Section bg="background.paper" aria-label="Дейности">
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {cards.map((card, index) => (
            <Panel key={card.title} component="li" tone={index % 2 === 0 ? "mint" : "paper"}>
              <Typography variant="h6" component="h2" sx={{ color: "primary.main", fontSize: 17 }}>
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: 14, flexGrow: 1 }}>{card.text}</Typography>
              <Button variant={card.primary ? "contained" : "outlined"} href={card.cta.href} sx={{ minWidth: 220 }}>
                {card.cta.label}
              </Button>
            </Panel>
          ))}
        </Box>
      </Section>
    </>
  );
}
