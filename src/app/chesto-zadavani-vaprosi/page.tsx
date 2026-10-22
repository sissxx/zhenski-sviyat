import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FaqList } from "@/components/faq/FaqList";
import { PageIntro } from "@/components/ui/PageIntro";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { faqs } from "@/content/faq";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Често задавани въпроси",
  description: "Отговори на въпроси за членството, събитията, консултациите и плащанията в Сдружение Женски свят.",
};

export default function FaqPage() {
  return (
    <>
      <PageIntro
        eyebrow="Често задавани въпроси"
        title="Седем въпроса и отговора по конкретни казуси"
        lead="Отговори на конкретни казуси, свързани с услугите, събитията и членството."
      />

      <Section bg="brand.mintLight" aria-label="Въпроси и отговори">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FaqList items={faqs} idPrefix="faq-page" striped />
          <Placeholder label="Чернова">Отговорите ще бъдат заменени с подготвените от екипа на сдружението.</Placeholder>
        </Box>
      </Section>

      <Section bg="brand.sand" aria-labelledby="faq-more-title">
        <Typography id="faq-more-title" variant="h4" component="h2" sx={{ mb: 1 }}>
          Не намери отговор?
        </Typography>
        <Typography sx={{ mb: 2.5 }}>Пиши ни и ще ти отговорим възможно най-скоро.</Typography>
        <Button variant="contained" href={routes.contacts}>
          Свържи се с нас
        </Button>
      </Section>
    </>
  );
}
