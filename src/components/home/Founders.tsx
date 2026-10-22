import Box from "@mui/material/Box";
import { AppLink } from "@/components/ui/AppLink";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { founders } from "@/content/founders";
import { routes } from "@/lib/routes";

export function Founders() {
  return (
    <Section bg="background.paper" aria-labelledby="founders-title">
      <Typography id="founders-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
        Хората зад общността
      </Typography>
      <Box
        component="ul"
        sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1.75, gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", lg: "repeat(7, 1fr)" } }}
      >
        {founders.map(({ shortName: name }) => (
          <li key={name}>
            <AppLink
              href={routes.founders}
              underline="none"
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, p: 1, borderRadius: "12px", "&:hover": { bgcolor: "brand.mint" } }}
            >
              {/* Portrait placeholder from Figma; replace with approved photos. */}
              <Box aria-hidden sx={{ width: 54, height: 54, borderRadius: "50%", bgcolor: "brand.sage" }} />
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "brand.dark", textAlign: "center" }}>{name}</Typography>
            </AppLink>
          </li>
        ))}
      </Box>
    </Section>
  );
}
