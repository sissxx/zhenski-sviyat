import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { servicePackages } from "@/content/packages";
import { contactPath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("packages");

export default function PackagesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Пакети и промоции"
        title="Предложения за услуги и членство"
        lead="Комбинирани предложения за услуги и членство. Конкретните пакети и цени предстои да бъдат потвърдени."
      />

      <Section bg="background.paper" aria-label="Пакети">
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>
          {servicePackages.map((item) => (
            <Panel key={item.title} component="li">
              <Typography variant="h6" component="h2" sx={{ color: "primary.main" }}>
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: 14, flexGrow: 1 }}>{item.text}</Typography>
              <Placeholder>Цена и условия.</Placeholder>
              <Button variant="outlined" href={contactPath(item.title)} aria-label={`Запитване за ${item.title}`}>
                Запитване
              </Button>
            </Panel>
          ))}
        </Box>
      </Section>
    </>
  );
}
