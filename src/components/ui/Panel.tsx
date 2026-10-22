import type { ElementType, ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

const tones = {
  paper: { bgcolor: "background.paper", borderColor: "divider" },
  card: { bgcolor: "brand.card", borderColor: "divider" },
  mint: { bgcolor: "brand.mint", borderColor: "divider" },
} as const;

type PanelProps = {
  children: ReactNode;
  tone?: keyof typeof tones;
  component?: ElementType;
  sx?: SxProps<Theme>;
  id?: string;
  "aria-labelledby"?: string;
};

/** Bordered, rounded content card used across the inner pages. */
export function Panel({ children, tone = "paper", component = "div", sx, ...rest }: PanelProps) {
  return (
    <Box
      component={component}
      sx={[
        {
          ...tones[tone],
          border: "1px solid",
          borderRadius: "18px",
          p: { xs: 2.5, md: 3 },
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 1.5,
          minWidth: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
