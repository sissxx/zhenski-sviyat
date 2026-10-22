import type { ReactNode } from "react";
import Typography from "@mui/material/Typography";
import { PageIntro } from "@/components/ui/PageIntro";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";

type LegalPlaceholderProps = { eyebrow: string; title: string; lead: string; children: ReactNode };

/** Legal page whose final text the association has yet to provide. */
export function LegalPlaceholder({ eyebrow, title, lead, children }: LegalPlaceholderProps) {
  return (
    <>
      <PageIntro eyebrow={eyebrow} title={title} lead={lead} />
      <Section bg="brand.mintLight">
        <Panel sx={{ maxWidth: 820, gap: 2, p: { xs: 2.5, md: 4 } }}>
          <Placeholder>Окончателният текст предстои да бъде публикуван.</Placeholder>
          <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
            Накратко
          </Typography>
          {children}
        </Panel>
      </Section>
    </>
  );
}
