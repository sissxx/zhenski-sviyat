import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { routes } from "@/lib/routes";

export default function NotFound() {
  return (
    <Section bg="background.default" sx={{ py: { xs: 10, md: 16 }, textAlign: "center" }}>
      <Typography variant="eyebrow">Грешка 404</Typography>
      <Typography variant="h2" component="h1" sx={{ mt: 1.5, mb: 2 }}>
        Тази страница не е намерена
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 4 }}>
        Възможно е страницата да е преместена или все още да се подготвя.
      </Typography>
      <Button variant="contained" href={routes.home}>
        Към началото
      </Button>
    </Section>
  );
}
