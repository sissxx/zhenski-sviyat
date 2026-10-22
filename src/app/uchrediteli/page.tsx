import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { NextSteps } from "@/components/ui/NextSteps";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";
import { founders } from "@/content/founders";

export const metadata: Metadata = {
  title: "Учредители",
  description: "Учредителите на Сдружение Женски свят: юристи, психолози и специалисти в здравните грижи и естетиката.",
};

export default function FoundersPage() {
  return (
    <>
      <PageIntro
        eyebrow="Учредители"
        title="Запознай се с учредителите на сдружението."
        lead="Учредители и специалисти с опит в подкрепата, правото, психологията и здравните грижи."
      />

      <Section bg="background.paper" aria-label="Учредители">
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {founders.map((founder) => (
            <Panel key={founder.name} component="li" tone="card" sx={{ flexDirection: "row", alignItems: "center", gap: 2.25 }}>
              {/* Portrait placeholder until approved photos arrive. */}
              <Box aria-hidden sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: "50%", bgcolor: "brand.sage" }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" component="h2" sx={{ fontSize: { xs: 19, md: 22 } }}>
                  {founder.name}
                </Typography>
                <Typography sx={{ fontSize: 14, mt: 0.75 }}>{founder.role}</Typography>
              </Box>
            </Panel>
          ))}
        </Box>
      </Section>

      <NextSteps />
    </>
  );
}
