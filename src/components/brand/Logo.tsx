import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * "Женски свят" mark. The green circle is the placeholder symbol from Figma;
 * swap it for the official SVG once NSJS supplies it.
 */
export function WomensWorldLogo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0 }}
      />
      <Box sx={{ color: "primary.main", lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{ display: "block", fontFamily: "var(--font-lora)", fontWeight: 700, fontSize: 18, lineHeight: 1.1, whiteSpace: "nowrap" }}
        >
          ЖЕНСКИ СВЯТ
        </Typography>
        <Typography
          component="span"
          sx={{ display: "block", fontWeight: 600, fontSize: 7, letterSpacing: "0.35em", whiteSpace: "nowrap" }}
        >
          ПЪТ КЪМ СЕБЕ СИ
        </Typography>
      </Box>
    </Box>
  );
}

/** НСЖС wordmark with the organisation's full name underneath. */
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
        НСЖС
      </Typography>
      {!inverse && (
        <Typography
          component="span"
          sx={{ display: "block", fontWeight: 600, fontSize: 8, color: "text.secondary", whiteSpace: "nowrap", mt: 0.25 }}
        >
          НАЦИОНАЛНА СЪЮЗНА ЖЕНСКА СОЛИДАРНОСТ
        </Typography>
      )}
    </Box>
  );
}
