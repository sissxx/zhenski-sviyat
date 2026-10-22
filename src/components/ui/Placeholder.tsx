import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Marks copy that is still a placeholder (prices, contacts, dates the
 * association has not confirmed yet). Search for `data-placeholder` before launch.
 */
export function Placeholder({ children, label = "Предстои" }: { children: ReactNode; label?: string }) {
  return (
    <Typography data-placeholder variant="body2" component="p" sx={{ color: "text.secondary" }}>
      <Box
        component="span"
        sx={{
          display: "inline-block",
          mr: 1,
          px: 0.75,
          border: "1px dashed",
          borderColor: "brand.accent",
          borderRadius: "6px",
          fontSize: 11,
          fontWeight: 600,
          lineHeight: "18px",
          color: "brand.accent",
          verticalAlign: "1px",
        }}
      >
        {label}
      </Box>
      {children}
    </Typography>
  );
}
