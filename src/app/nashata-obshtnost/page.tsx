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
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";
import { perInterval } from "@/lib/subscriptions/plans";
import { listPublicPlans } from "@/lib/subscriptions/queries";

export const metadata: Metadata = pageMetadata("community");

/** Plans that have their own page; the others link to the membership page. */
const planPages = new Map<string, string>(Object.values(membershipPlans).map((plan) => [plan.slug, plan.href]));

export default async function CommunityPage() {
  // The plans from the admin panel (or the built-in ones until there are any), as on the membership page.
  const { plans } = await listPublicPlans();
  const cards = [
    ...communityAreas,
    ...plans.map((plan, index) => ({
      title: plan.name,
      text: plan.description ?? "",
      cta: {
        label: `Членство · ${formatPrice(plan.priceCents)} / ${perInterval(plan.billingInterval)}`,
        href: planPages.get(plan.slug) ?? routes.membership,
      },
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
