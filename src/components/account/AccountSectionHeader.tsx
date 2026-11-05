import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/** Title and one line of explanation at the top of each profile section. */
export function AccountSectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Box component="header" sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="h4" component="h2" sx={{ color: "primary.main" }}>
        {title}
      </Typography>
      {children && <Typography sx={{ color: "text.secondary" }}>{children}</Typography>}
    </Box>
  );
}
