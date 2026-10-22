"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { routes } from "@/lib/routes";

/** Friendly page for unexpected errors, with a retry, instead of Next.js's default message. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Section bg="background.default" sx={{ py: { xs: 10, md: 16 }, textAlign: "center" }}>
      <Typography variant="eyebrow">Нещо се обърка</Typography>
      <Typography variant="h2" component="h1" sx={{ mt: 1.5, mb: 2 }}>
        Страницата не успя да се зареди
      </Typography>
      <Typography sx={{ color: "text.secondary", mb: 4 }}>
        Опитай отново след малко. Ако проблемът продължава, пиши ни.
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
        <Button variant="contained" onClick={reset}>
          Опитай отново
        </Button>
        <Button variant="outlined" href={routes.contacts}>
          Свържи се с нас
        </Button>
      </Box>
    </Section>
  );
}
