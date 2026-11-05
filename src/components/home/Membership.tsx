import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { membershipPlans } from "@/content/plans";
import { formatPrice } from "@/lib/locale";
import { routes } from "@/lib/routes";
import { perInterval } from "@/lib/subscriptions/plans";
import { listPublicPlans } from "@/lib/subscriptions/queries";

/** Plans that have their own page, with the button text that leads there. */
const planPages = new Map<string, { href: string; label: string }>(Object.values(membershipPlans).map((plan) => [plan.slug, { href: plan.href, label: plan.ctaLabel }]));

export async function Membership() {
  const { plans } = await listPublicPlans();
  return (
    <Section bg="brand.moss" aria-labelledby="membership-title">
      <Typography id="membership-title" variant="h3" component="h2" sx={{ mb: 1.5 }}>
        Намери своето място в общността
      </Typography>
      <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
        Срещай се, учи, споделяй и получавай подкрепа в среда, създадена за жени.
      </Typography>
      <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {plans.map((plan) => {
          const page = planPages.get(plan.slug) ?? { href: routes.membership, label: "Научи повече" };
          return (
            <Box
              key={plan.slug}
              sx={{ bgcolor: "background.paper", border: "1px solid #CBD8C2", borderRadius: "22px", p: 3, display: "flex", flexDirection: "column", gap: 1.75 }}
            >
              <Typography variant="eyebrow">{plan.billingInterval === "year" ? "Годишно членство" : "Месечно членство"}</Typography>
              <Typography variant="h4" component="h3">
                {plan.name}
              </Typography>
              {plan.description && <Typography variant="body2">{plan.description}</Typography>}
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
                <Typography sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 26, color: "brand.terracotta" }}>
                  {formatPrice(plan.priceCents)}
                  <Typography component="span" sx={{ fontFamily: "var(--font-inter)", fontWeight: 400, fontSize: 14, color: "text.secondary", ml: 1 }}>
                    / {perInterval(plan.billingInterval)}
                  </Typography>
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" href={page.href}>
                  {page.label}
                </Button>
              </Box>
              <Typography variant="caption">{plan.allowBankTransfer ? "Плащане с карта или по банков път" : "Плащане с карта"}</Typography>
            </Box>
          );
        })}
      </Box>
    </Section>
  );
}
