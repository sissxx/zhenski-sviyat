import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("contacts");

type ContactPageProps = { searchParams: Promise<{ tema?: string | string[] }> };

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { tema } = await searchParams;
  const subject = typeof tema === "string" ? tema.slice(0, 150) : "";

  return (
    <>
      <PageIntro
        eyebrow="Контакти"
        title="Свържи се с нас"
        lead="Изпрати запитване чрез контактната форма или се свържи с нас на националния телефон за връзка."
      />

      <Section bg="brand.mintLight" aria-label="Контактна информация и форма">
        <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "3fr 4fr" }, alignItems: "start" }}>
          <Panel tone="mint" aria-labelledby="contact-info-title">
            <Typography id="contact-info-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Контакти
            </Typography>
            <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography component="dt" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
                  Национален телефон за връзка
                </Typography>
                <Box component="dd" sx={{ m: 0, mt: 0.5 }}>
                  <Placeholder>Телефонът предстои да бъде предоставен.</Placeholder>
                </Box>
              </Box>
              <Box>
                <Typography component="dt" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main" }}>
                  Имейл и адрес
                </Typography>
                <Box component="dd" sx={{ m: 0, mt: 0.5 }}>
                  <Placeholder>Данните предстои да бъдат предоставени, ако ще бъдат публикувани.</Placeholder>
                </Box>
              </Box>
            </Box>
          </Panel>

          <Panel aria-labelledby="contact-form-title" sx={{ p: { xs: 2.5, md: 3.5 }, gap: 2.25 }}>
            <Typography id="contact-form-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Пиши ни
            </Typography>
            <ContactForm defaultSubject={subject} />
          </Panel>
        </Box>
      </Section>
    </>
  );
}
