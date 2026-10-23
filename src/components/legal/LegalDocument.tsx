import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import type { LegalBlock, LegalSection } from "@/content/legal/types";
import { legalEntity, legalTextsReviewed, legalUpdatedAt } from "@/lib/legal";
import { formatDate } from "@/lib/locale";

type LegalDocumentProps = { eyebrow: string; title: string; lead: string; sections: LegalSection[] };

const entityRows: { label: string; value: string | null }[] = [
  { label: "Наименование", value: legalEntity.registeredName },
  { label: "ЕИК", value: legalEntity.eik },
  { label: "Седалище и адрес на управление", value: legalEntity.address },
  { label: "Представлявано от", value: legalEntity.representative },
  { label: "Имейл", value: legalEntity.email },
  { label: "Телефон", value: legalEntity.phone },
];

/** A legal page: date in force, the association's details, a table of contents and numbered sections. */
export function LegalDocument({ eyebrow, title, lead, sections }: LegalDocumentProps) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} lead={lead} />
      <Section bg="brand.mintLight">
        <Panel sx={{ maxWidth: 860, gap: 3, p: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              В сила от {formatDate(legalUpdatedAt)}
            </Typography>
            {!legalTextsReviewed && (
              <Placeholder label="Чернова">Текстът предстои да бъде прегледан от юрист.</Placeholder>
            )}
          </Box>

          <Box component="section" aria-labelledby="legal-entity-title">
            <Typography id="legal-entity-title" variant="h5" component="h2" sx={{ color: "primary.main", mb: 1.5 }}>
              Данни за сдружението
            </Typography>
            <Box
              component="dl"
              sx={{ m: 0, display: "grid", gap: { xs: 0.5, sm: 1 }, gridTemplateColumns: { xs: "1fr", sm: "220px 1fr" } }}
            >
              {entityRows.map((row) => (
                <Box key={row.label} sx={{ display: "contents" }}>
                  <Typography component="dt" sx={{ fontWeight: 600, fontSize: 14, color: "primary.main", mt: { xs: 1, sm: 0 } }}>
                    {row.label}
                  </Typography>
                  <Box component="dd" sx={{ m: 0 }}>
                    {row.value ? <Typography>{row.value}</Typography> : <Placeholder>Предстои да бъде попълнено.</Placeholder>}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box component="nav" aria-labelledby="legal-toc-title">
            <Typography id="legal-toc-title" variant="h5" component="h2" sx={{ color: "primary.main", mb: 1 }}>
              Съдържание
            </Typography>
            <Box component="ol" sx={{ m: 0, pl: 3, display: "grid", gap: 0.5 }}>
              {sections.map((section) => (
                <li key={section.id}>
                  <Box component="a" href={`#${section.id}`} sx={{ color: "primary.main", textDecoration: "underline" }}>
                    {section.title}
                  </Box>
                </li>
              ))}
            </Box>
          </Box>

          {sections.map((section, index) => (
            <Box
              component="section"
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-title`}
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, scrollMarginTop: 96 }}
            >
              <Typography id={`${section.id}-title`} variant="h5" component="h2" sx={{ color: "primary.main" }}>
                {index + 1}. {section.title}
              </Typography>
              {section.blocks.map((block, i) => (
                <LegalBlockView key={i} block={block} />
              ))}
            </Box>
          ))}
        </Panel>
      </Section>
    </>
  );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <Typography>{block}</Typography>;
  return (
    <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
      {block.list.map((item) => (
        <Typography component="li" key={item}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}
