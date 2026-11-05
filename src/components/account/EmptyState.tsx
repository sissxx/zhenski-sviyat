import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";

type EmptyStateProps = { children: ReactNode; action?: { label: string; href: string } };

/** Placeholder for an account section with nothing in it yet; the section's own header names it. */
export function EmptyState({ children, action }: EmptyStateProps) {
  return (
    <Panel
      tone="card"
      sx={{ alignItems: "flex-start", gap: 1.5, p: { xs: 2.5, md: 4 }, borderLeft: "4px solid", borderLeftColor: "brand.terracotta" }}
    >
      <Typography sx={{ color: "text.secondary" }}>{children}</Typography>
      {action && (
        <Button variant="contained" href={action.href}>
          {action.label}
        </Button>
      )}
    </Panel>
  );
}
