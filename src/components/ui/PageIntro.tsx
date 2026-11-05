import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Section } from "./Section";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
};

/** Mint band that opens every inner page: eyebrow, page heading (the page's h1) and a lead paragraph. */
export function PageIntro({ eyebrow, title, lead, children }: PageIntroProps) {
  return (
    <Section bg="brand.mint" sx={{ py: { xs: 4, md: 5.5 } }}>
      <Typography variant="eyebrow" sx={{ fontSize: { xs: 12, md: 14 }, mb: 1.25 }}>
        {eyebrow}
      </Typography>
      <Typography
        variant="h1"
        sx={{ color: "primary.main", fontSize: "clamp(2rem, 4.5vw, 2.75rem)", lineHeight: 1.2, maxWidth: 960 }}
      >
        {title}
      </Typography>
      <Box aria-hidden sx={{ width: 56, height: 3, borderRadius: 2, bgcolor: "brand.terracotta", mt: 2 }} />
      {lead && (
        <Typography sx={{ mt: 1.5, fontSize: { xs: 15, md: 16 }, maxWidth: 820 }}>{lead}</Typography>
      )}
      {children}
    </Section>
  );
}
