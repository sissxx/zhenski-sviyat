import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { missionStats } from "@/content/home";
import { getTexts } from "@/lib/content/texts";
import { routes } from "@/lib/routes";
import { listTeamMembers } from "@/lib/team/queries";

export async function About() {
  const [members, t] = await Promise.all([listTeamMembers(), getTexts()]);
  const founderCount = members.filter((m) => m.group === "founder").length;
  return (
    <Section bg="brand.sand" aria-labelledby="about-title">
      <Box sx={{ display: "grid", gap: { xs: 3, md: 5 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, alignItems: "start" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          <Typography variant="eyebrow">За сдружението</Typography>
          <Typography id="about-title" variant="h2">
            {t("home.about.title")}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-line" }}>{t("home.about.text")}</Typography>
          <Button variant="outlined" href={routes.about}>
            Научи повече за нас
          </Button>
        </Box>

        <Box sx={{ bgcolor: "brand.mint", borderRadius: "22px", p: 3.25, display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="h4" component="h3">
            Нашата мисия
          </Typography>
          <Typography sx={{ whiteSpace: "pre-line" }}>{t("home.mission.text")}</Typography>
          <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: { xs: 1.5, sm: 2.25 }, m: 0 }}>
            {missionStats(founderCount).map((stat) => (
              <Box key={stat.label} sx={{ minWidth: 0, display: "flex", flexDirection: "column-reverse", gap: 0.5 }}>
                <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
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
