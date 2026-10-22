import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { site } from "@/lib/site";

/** Official horizontal logo (public/brand/logo-horizontal.svg, 1120×430). */
export function WomensWorldLogo() {
  return (
    <Box sx={{ position: "relative", height: { xs: 48, lg: 58 }, aspectRatio: "1120 / 430", flexShrink: 0 }}>
      <Image src="/brand/logo-horizontal.svg" alt={`${site.logoName} — ${site.tagline}`} fill priority />
    </Box>
  );
}

/** Organisation short-name wordmark with the organisation's full name underneath. */
export function NsjsWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Box sx={{ lineHeight: 1 }}>
      <Typography
        component="span"
        sx={{
          display: "block",
          fontFamily: "var(--font-lora)",
          fontWeight: 700,
          fontSize: inverse ? 27 : 24,
          lineHeight: 1.1,
          color: inverse ? "brand.paper" : "brand.dark",
        }}
      >
        {site.orgShortName}
      </Typography>
      {!inverse && (
        <Typography
          component="span"
          sx={{ display: "block", fontWeight: 600, fontSize: 8, color: "text.secondary", whiteSpace: "nowrap", mt: 0.25 }}
        >
          {site.orgFullName.toLocaleUpperCase("bg-BG")}
        </Typography>
      )}
    </Box>
  );
}
