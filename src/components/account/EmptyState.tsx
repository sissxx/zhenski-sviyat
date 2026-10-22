import type { ReactNode } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";

type EmptyStateProps = { title: string; children: ReactNode; action?: { label: string; href: string } };

/** Placeholder for an account section with nothing in it yet. */
export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <Panel tone="card" sx={{ alignItems: "flex-start", gap: 1.5, p: { xs: 2.5, md: 4 } }}>
      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        {title}
      </Typography>
      <Typography sx={{ color: "text.secondary" }}>{children}</Typography>
      {action && (
        <Button variant="contained" href={action.href}>
          {action.label}
        </Button>
      )}
    </Panel>
  );
}
