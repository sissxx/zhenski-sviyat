import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { TextLink } from "@/components/ui/AppLink";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { membershipPlans } from "@/content/plans";
import { formatPrice } from "@/lib/locale";
import { joinPlanPath, routes } from "@/lib/routes";
import { perInterval, type PublicPlan } from "@/lib/subscriptions/plans";
import { listPublicPlans } from "@/lib/subscriptions/queries";

export const metadata: Metadata = {
  title: "Членство",
  description: "Месечните членства в Сдружение Женски свят: какво включват, колко струват и как се плащат.",
};

/** Plans that also have their own page with more about them. */
const planPages = new Map<string, string>(Object.values(membershipPlans).map((plan) => [plan.slug, plan.href]));

const steps = [
  { title: "Избери членство", text: "Създай безплатен профил или влез в своя и избери плана, който ти подхожда." },
  {
    title: "Плати с карта или по банков път",
    text: "С карта абонаментът се подновява сам всеки месец. По банков път превеждаш таксата всеки месец и екипът потвърждава плащането.",
  },
  {
    title: "Влез във Viber групите",
    text: "Щом членството е активно, линковете към Viber групите на плана ти се появяват в „Моят профил“.",
  },
];

const rules = [
  "С карта можеш да прекратиш абонамента по всяко време от профила си. Достъпът остава до края на платения месец.",
  "При банков превод членството се активира, след като екипът потвърди плащането. Ако пропуснеш превод, достъпът остава до края на вече платения месец.",
  "Когато членството изтече, достъпът до Viber групите на плана спира и екипът те премахва от тях.",
];

export default async function MembershipPage() {
  const { plans, fromContent } = await listPublicPlans();

  return (
    <>
      <PageIntro
        eyebrow="Членство"
        title="Стани член на общността"
        lead="Месечни членства с достъп до затворените Viber групи на сдружението и до съдържанието на клубовете ни."
      />

      <Section bg="brand.mintLight" aria-labelledby="plans-title">
        <Typography id="plans-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
          Планове
        </Typography>
        <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {plans.map((plan) => (
            <PlanCard key={plan.slug} plan={plan} />
          ))}
        </Box>
        {fromContent && (
          <Box sx={{ mt: 2 }}>
            <Placeholder label="Скоро">
              Онлайн активирането на членство предстои. Можеш да създадеш профил още сега.
            </Placeholder>
          </Box>
        )}
      </Section>

      <Section aria-labelledby="how-title">
        <Typography id="how-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
          Как става
        </Typography>
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
          {steps.map((step, index) => (
            <Panel key={step.title} component="li" tone="card" sx={{ gap: 1 }}>
              <Typography aria-hidden sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 28, color: "brand.accent", lineHeight: 1 }}>
                {index + 1}
              </Typography>
              <Typography variant="h5" component="h3" sx={{ color: "primary.main" }}>
                {step.title}
              </Typography>
              <Typography variant="body2">{step.text}</Typography>
            </Panel>
          ))}
        </Box>
      </Section>

      <Section bg="brand.sand" aria-labelledby="rules-title">
        <Typography id="rules-title" variant="h3" component="h2" sx={{ mb: 1.5 }}>
          Плащане и прекратяване
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 1, maxWidth: 820 }}>
          {rules.map((rule) => (
            <li key={rule}>
              <Typography>{rule}</Typography>
            </li>
          ))}
        </Box>
        <Typography sx={{ mt: 2 }}>
          Още отговори има в <TextLink href={routes.faq}>често задаваните въпроси</TextLink>.
        </Typography>
      </Section>
    </>
  );
}

function PlanCard({ plan }: { plan: PublicPlan }) {
  const titleId = `plan-${plan.slug}`;
  const morePage = planPages.get(plan.slug);
  return (
    <Panel component="section" aria-labelledby={titleId} sx={{ gap: 1.75, borderRadius: "22px" }}>
      <Typography variant="eyebrow">{plan.billingInterval === "year" ? "Годишно членство" : "Месечно членство"}</Typography>
      <Typography id={titleId} variant="h4" component="h3" sx={{ color: "primary.main" }}>
        {plan.name}
      </Typography>
      {plan.description && (
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          {plan.description}
        </Typography>
      )}
      <Typography sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 32, lineHeight: 1.2, color: "brand.dark" }}>
        {formatPrice(plan.priceCents)}
        <Typography component="span" sx={{ fontFamily: "var(--font-inter)", fontWeight: 400, fontSize: 14, color: "text.secondary", ml: 1 }}>
          / {perInterval(plan.billingInterval)}
        </Typography>
      </Typography>
      {plan.priceProvisional && <Placeholder label="Цена">Окончателната цена предстои да бъде потвърдена.</Placeholder>}

      {plan.features.length > 0 && (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          {plan.features.map((feature) => (
            <Box component="li" key={feature} sx={{ display: "flex", gap: 1.25, fontSize: 14 }}>
              <Box component="span" aria-hidden sx={{ width: 20, flexShrink: 0, fontWeight: 600, color: "brand.accent" }}>
                ✓
              </Box>
              {feature}
            </Box>
          ))}
        </Box>
      )}

      {plan.viberGroups.length > 0 && (
        <Typography variant="body2">
          <Box component="span" sx={{ fontWeight: 600 }}>
            Viber {plan.viberGroups.length === 1 ? "група" : "групи"}:
          </Box>{" "}
          {plan.viberGroups.join(", ")}
        </Typography>
      )}

      <Typography variant="caption">
        {plan.allowBankTransfer ? "Плащане с карта или по банков път" : "Плащане с карта"}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: "auto" }}>
        <Button variant="contained" href={joinPlanPath(plan.slug)}>
          Стани член
        </Button>
        {morePage && (
          <Button variant="outlined" href={morePage}>
            Научи повече
          </Button>
        )}
      </Box>
    </Panel>
  );
}
