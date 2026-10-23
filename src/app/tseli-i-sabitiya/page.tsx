import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { goals } from "@/content/about";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("goals");

export default function GoalsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Цели и събития"
        title="Нашите цели"
        lead="Работим за взаимно сътрудничество, подкрепа и по-силна роля на жените в обществения и икономическия живот."
      />

      <Section bg="brand.mintLight" aria-label="Цели">
        <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1.75 }}>
          {goals.map((goal, index) => (
            <Box
              component="li"
              key={goal}
              sx={{
                bgcolor: index % 2 === 0 ? "brand.mint" : "background.paper",
                borderRadius: "12px",
                p: { xs: 2, md: 2.25 },
                display: "grid",
                gap: { xs: 1, sm: 2.5 },
                gridTemplateColumns: { xs: "1fr", sm: "48px 1fr" },
              }}
            >
              <Typography aria-hidden sx={{ fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 18, color: "primary.main" }}>
                {String(index + 1).padStart(2, "0")}
              </Typography>
              <Typography sx={{ fontSize: 14 }}>{goal}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Button variant="contained" href={routes.events}>
            Виж събитията
          </Button>
        </Box>
      </Section>
    </>
  );
}
