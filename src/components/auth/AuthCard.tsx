import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";
import { Section } from "@/components/ui/Section";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  /** Links under the card, such as "Нямаш профил? Регистрирай се". */
  footer?: ReactNode;
};

/** Centred card on a mint band, shared by the login, sign-up and password pages. */
export function AuthCard({ eyebrow, title, lead, children, footer }: AuthCardProps) {
  return (
    <Section bg="brand.mint" sx={{ py: { xs: 4, md: 8 } }}>
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Panel aria-labelledby="auth-title" sx={{ p: { xs: 2.5, sm: 4 }, gap: 2.5, alignItems: "stretch" }}>
          <Box>
            <Typography variant="eyebrow" sx={{ fontSize: { xs: 12, md: 13 }, mb: 1 }}>
              {eyebrow}
            </Typography>
            <Typography
              id="auth-title"
              variant="h1"
              sx={{ color: "primary.main", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", lineHeight: 1.2 }}
            >
              {title}
            </Typography>
            {lead && <Typography sx={{ mt: 1.25, color: "text.secondary" }}>{lead}</Typography>}
          </Box>
          {children}
        </Panel>
        {footer && (
          <Typography component="div" variant="body2" sx={{ mt: 2.5, textAlign: "center", display: "grid", gap: 1 }}>
            {footer}
          </Typography>
        )}
      </Box>
    </Section>
  );
}
