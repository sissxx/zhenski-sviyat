import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/ui/AppLink";
import { Section } from "@/components/ui/Section";
import { topics } from "@/content/home";
import { routes } from "@/lib/routes";

export function Topics() {
  return (
    <Section bg="background.paper" aria-labelledby="topics-title" sx={{ py: { xs: 5, md: 5 } }}>
      <Typography id="topics-title" variant="h3" component="h2" sx={{ mb: 2.5 }}>
        Подкрепа за всяка част от твоя път
      </Typography>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gap: 1.75,
          // minmax(0, 1fr): a long word like "Психологическа" must not widen its column past a 320px screen.
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
        }}
      >
        {topics.map((topic) => (
          <li key={topic.title}>
            {/* Each topic leads to booking: consultations are where every kind of support starts. */}
            <AppLink
              href={routes.consultations}
              underline="none"
              sx={{
                height: "100%",
                bgcolor: "brand.card",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "18px",
                p: { xs: 1.5, sm: 2 },
                minHeight: 136,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                color: "text.primary",
                transition: "border-color 150ms, background-color 150ms",
                "&:hover": { borderColor: "primary.main", bgcolor: "brand.mint" },
              }}
            >
              <Box aria-hidden sx={{ fontSize: 23, lineHeight: 1.2, color: "brand.accent" }}>
                {topic.icon}
              </Box>
              <Typography variant="h6" component="h3" sx={{ fontSize: { xs: 14, sm: 15 }, overflowWrap: "anywhere" }}>
                {topic.title}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary", flexGrow: 1 }}>{topic.text}</Typography>
              <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: "primary.main" }}>
                Запиши час <span aria-hidden>→</span>
              </Typography>
            </AppLink>
          </li>
        ))}
      </Box>
    </Section>
  );
}
