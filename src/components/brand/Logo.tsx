import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { site } from "@/lib/site";

/** Official horizontal logo (public/brand/logo-horizontal.svg, 1120×430). */
export function WomensWorldLogo() {
  return (
    <Box sx={{ position: "relative", height: { xs: 48, lg: 58 }, aspectRatio: "1120 / 430", flexShrink: 0 }}>
      <Image src="/brand/logo-horizontal.svg" alt={`${site.name} — ${site.tagline}`} fill priority />
    </Box>
  );
}

/** Text wordmark for dark backgrounds, where the green logo would not show. */
export function SiteWordmark() {
  return (
    <Box sx={{ lineHeight: 1 }}>
      <Typography
        component="span"
        sx={{ display: "block", fontWeight: 600, fontSize: 11, letterSpacing: "0.08em", color: "brand.sage", textTransform: "uppercase" }}
      >
        Сдружение
      </Typography>
      <Typography
        component="span"
        sx={{ display: "block", fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 27, lineHeight: 1.15, color: "brand.paper" }}
      >
        {site.shortName}
      </Typography>
    </Box>
  );
}
