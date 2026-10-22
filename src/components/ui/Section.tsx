import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

type SectionProps = {
  children: ReactNode;
  /** Background colour (theme path such as "brand.sand" or a CSS colour). */
  bg?: string;
  id?: string;
  "aria-labelledby"?: string;
  sx?: SxProps<Theme>;
};

/** Full-width band with the page's content column (1320px max, as in Figma). */
export function Section({ children, bg, sx, ...rest }: SectionProps) {
  return (
    <Box component="section" sx={[{ bgcolor: bg, py: { xs: 5, md: 7 } }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      <Box sx={{ maxWidth: 1320, mx: "auto", px: { xs: 2, sm: 3, md: 4, xl: 0 } }}>{children}</Box>
    </Box>
  );
}
