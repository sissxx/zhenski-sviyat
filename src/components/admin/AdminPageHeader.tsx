import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type AdminPageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Link back to the list, shown above the title. */
  back?: { label: string; href: string };
  action?: { label: string; href: string };
  children?: ReactNode;
};

/** Title row of an admin page, with an optional "back" link and main action. */
export function AdminPageHeader({ title, description, back, action, children }: AdminPageHeaderProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {back && (
        <Button href={back.href} size="small" sx={{ alignSelf: "flex-start", minWidth: 0, minHeight: 32, px: 1, ml: -1 }}>
          ← {back.label}
        </Button>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h3" component="h1" sx={{ color: "primary.main" }}>
          {title}
        </Typography>
        {action && (
          <Button variant="contained" href={action.href}>
            {action.label}
          </Button>
        )}
        {children}
      </Box>
      {description && <Typography sx={{ color: "text.secondary", maxWidth: 760 }}>{description}</Typography>}
    </Box>
  );
}
