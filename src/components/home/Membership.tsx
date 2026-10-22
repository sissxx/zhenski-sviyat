import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { membershipPlans } from "@/content/home";
import { formatPrice } from "@/lib/locale";

export function Membership() {
  return (
    <Section bg="brand.moss" aria-labelledby="membership-title">
      <Typography id="membership-title" variant="h3" component="h2" sx={{ mb: 1.5 }}>
        Намери своето място в общността
      </Typography>
      <Typography sx={{ fontSize: 14, color: "text.secondary", mb: 2.5 }}>
        Срещай се, учи, споделяй и получавай подкрепа в среда, създадена за жени.
      </Typography>
      <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        {membershipPlans.map((plan) => (
          <Box
            key={plan.title}
            sx={{ bgcolor: "background.paper", border: "1px solid #CBD8C2", borderRadius: "22px", p: 3, display: "flex", flexDirection: "column", gap: 1.75 }}
          >
            <Typography variant="eyebrow">Месечно членство</Typography>
            <Typography variant="h4" component="h3">
              {plan.title}
            </Typography>
            <Typography variant="body2">{plan.text}</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
              <Typography sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 26, color: "brand.dark" }}>
                {formatPrice(plan.priceCents)}
                <Typography component="span" sx={{ fontFamily: "var(--font-inter)", fontWeight: 400, fontSize: 12, color: "text.secondary", ml: 1 }}>
                  / месец
                </Typography>
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="contained" href={plan.cta.href}>
                {plan.cta.label}
              </Button>
            </Box>
            <Typography variant="caption">Плащането и достъпът подлежат на уточняване</Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
