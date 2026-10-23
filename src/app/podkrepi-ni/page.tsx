import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { partnerSlots, supportOptions } from "@/content/support";
import { contactPath } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("support");

export default function SupportPage() {
  return (
    <>
      <PageIntro
        eyebrow="Партньори и подкрепи ни"
        title="Партньорства и начини за дарение"
        lead="Помогни ни да развиваме инициативите на сдружението и да достигаме до повече жени."
      />

      <Section bg="background.paper" aria-label="Партньори и дарения">
        <Box sx={{ display: "grid", gap: 3.5, gridTemplateColumns: { xs: "1fr", md: "3fr 4fr" }, alignItems: "start" }}>
          <Panel tone="mint" aria-labelledby="partners-title">
            <Typography id="partners-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Нашите партньори
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
              Организациите и специалистите, които подкрепят дейността на сдружението.
            </Typography>
            {/* Logo slots until NSJS sends partner names and original logo files. */}
            <Box aria-hidden sx={{ width: "100%", display: "grid", gap: 1.5, gridTemplateColumns: "repeat(3, 1fr)" }}>
              {Array.from({ length: partnerSlots }, (_, index) => (
                <Box key={index} sx={{ aspectRatio: "3 / 2", borderRadius: "10px", bgcolor: "background.paper", border: "1px dashed", borderColor: "brand.cardBorder" }} />
              ))}
            </Box>
            <Placeholder>Имената и логата на партньорите ще бъдат добавени след потвърждение.</Placeholder>
          </Panel>

          <Panel aria-labelledby="donate-title">
            <Typography id="donate-title" variant="h4" component="h2" sx={{ color: "primary.main" }}>
              Подкрепи ни
            </Typography>
            <Typography sx={{ fontSize: 14 }}>Избери как искаш да помогнеш и ние ще се свържем с теб с подробностите.</Typography>
            <Typography variant="eyebrow" component="h3" sx={{ mt: 0.5 }}>
              Начини за подкрепа
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, width: "100%", display: "flex", flexDirection: "column", gap: 1.25 }}>
              {supportOptions.map((option) => (
                <Panel key={option.title} component="li" tone="card" sx={{ p: { xs: 2, md: 2 }, gap: 1 }}>
                  <Typography variant="h6" component="h4">
                    {option.title}
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>{option.text}</Typography>
                  {option.note && <Placeholder>{option.note}</Placeholder>}
                  <Button variant="outlined" href={contactPath(option.subject)} sx={{ minWidth: 0 }}>
                    {option.title === "Партньорство" ? "Свържи се с нас" : "Искам да даря"}
                  </Button>
                </Panel>
              ))}
            </Box>
          </Panel>
        </Box>
      </Section>
    </>
  );
}
