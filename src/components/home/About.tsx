import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { missionStats } from "@/content/home";
import { routes } from "@/lib/routes";

export function About() {
  return (
    <Section bg="brand.sand" aria-labelledby="about-title">
      <Box sx={{ display: "grid", gap: { xs: 3, md: 5 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          <Typography variant="eyebrow">За сдружението</Typography>
          <Typography id="about-title" variant="h2">
            Общност, която подкрепя и вдъхновява жените.
          </Typography>
          <Typography>
            Създаваме пространство за взаимопомощ, професионално и личностно развитие и обмен на опит. Вярваме, че
            когато жените се подкрепят, се отварят повече възможности за всички.
          </Typography>
          <Button variant="outlined" href={routes.about}>
            Научи повече за нас
          </Button>
        </Box>

        <Box sx={{ bgcolor: "brand.mint", borderRadius: "22px", p: 3.25, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h4" component="h3">
            Нашата мисия
          </Typography>
          <Typography>
            Да изграждаме национална мрежа за взаимопомощ, която насърчава развитието, увереността и активното
            участие на жените.
          </Typography>
          <Box component="dl" sx={{ display: "flex", flexWrap: "wrap", gap: 2.25, m: 0 }}>
            {missionStats.map((stat) => (
              <Box key={stat.label} sx={{ minWidth: 120, display: "flex", flexDirection: "column-reverse", gap: 0.5 }}>
                <Typography component="dt" sx={{ fontSize: 12, color: "text.secondary" }}>
                  {stat.label}
                </Typography>
                <Typography component="dd" sx={{ m: 0, fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 21, color: "brand.dark" }}>
                  {stat.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}
