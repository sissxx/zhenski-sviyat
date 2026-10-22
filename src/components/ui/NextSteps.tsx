import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { routes } from "@/lib/routes";
import { Section } from "./Section";

/** Closing band that points visitors to events and consultations (Figma "Следващата стъпка"). */
export function NextSteps() {
  return (
    <Section bg="brand.sand" aria-labelledby="next-steps-title">
      <Typography id="next-steps-title" variant="h3" component="h2" sx={{ mb: 1.5 }}>
        Следващата стъпка
      </Typography>
      <Typography sx={{ mb: 2.5 }}>
        Разгледай нашите събития, консултации и членства, за да откриеш как да се включиш в общността.
      </Typography>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <Button variant="outlined" href={routes.events}>
          Виж събитията
        </Button>
        <Button variant="contained" href={routes.consultations}>
          Заяви консултация
        </Button>
      </Box>
    </Section>
  );
}
