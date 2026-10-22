import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { services } from "@/content/home";

export function Services() {
  return (
    <Section bg="brand.sand" aria-labelledby="services-title">
      <Typography id="services-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
        Подкрепа според твоите нужди
      </Typography>
      <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {services.map((service) => (
          <Box
            key={service.title}
            sx={{
              bgcolor: "common.white",
              border: "1px solid",
              borderColor: "brand.cardBorder",
              borderRadius: "20px",
              p: 2.75,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1.5,
            }}
          >
            <Typography variant="h5" component="h3">
              {service.title}
            </Typography>
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {service.text}
            </Typography>
            <Button variant={service.primary ? "contained" : "outlined"} href={service.cta.href}>
              {service.cta.label}
            </Button>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
