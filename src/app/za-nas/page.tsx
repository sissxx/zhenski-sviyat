import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/ui/AppLink";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { supportAreas } from "@/content/about";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "За нас",
  description: "Подкрепа, развитие и взаимопомощ: направленията, в които Сдружение Женски свят подкрепя жените.",
};

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="За сдружението"
        title="Подкрепа, развитие и взаимопомощ"
        lead="Обединяваме жени и специалисти, за да създаваме пространство за разбиране, знания, личностно израстване и професионално развитие."
      />

      <Section bg="background.paper" aria-labelledby="areas-title">
        <Typography id="areas-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
          Направления на подкрепа
        </Typography>
        <Box
          component="ul"
          sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}
        >
          {supportAreas.map((area, index) => (
            <Panel key={area.title} component="li" tone={index % 2 === 0 ? "card" : "paper"} sx={{ p: 2.5, gap: 1.25 }}>
              <Typography variant="h6" component="h3" sx={{ color: "primary.main" }}>
                {area.title}
              </Typography>
              <Typography sx={{ fontSize: 14, flexGrow: 1 }}>{area.text}</Typography>
              <AppLink
                href={routes.consultations}
                aria-label={`Запиши консултация: ${area.title}`}
                sx={{ fontSize: 14, fontWeight: 600 }}
              >
                Запиши консултация <span aria-hidden>→</span>
              </AppLink>
            </Panel>
          ))}
        </Box>
      </Section>

      <Section bg="brand.sand" aria-labelledby="about-next-title">
        <Typography id="about-next-title" variant="h3" component="h2" sx={{ mb: 1.5 }}>
          Какво следва?
        </Typography>
        <Typography sx={{ mb: 2.5, maxWidth: 720 }}>
          Запиши час при специалист или научи повече за хората и целите зад сдружението.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button variant="contained" href={routes.consultations}>
            Запиши консултация
          </Button>
          <Button variant="outlined" href={routes.founders}>
            Запознай се с учредителите
          </Button>
          <Button variant="outlined" href={routes.goals}>
            Нашите цели
          </Button>
        </Box>
      </Section>
    </>
  );
}
