import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";
import { routes } from "@/lib/routes";

export function Hero() {
  return (
    <Section bg="brand.mint" aria-labelledby="hero-title" sx={{ py: { xs: 6, md: 7.5 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 4, md: 5 },
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25, alignItems: "flex-start" }}>
          <Typography variant="eyebrow">Общност · Подкрепа · Развитие</Typography>
          <Typography id="hero-title" variant="h1">
            Заедно
            <br />
            по-силни.
          </Typography>
          <Typography variant="subtitle1" sx={{ maxWidth: 620 }}>
            Място за подкрепа, споделяне и развитие. Обединяваме жени, които искат да растат, да учат и да
            създават промяна заедно.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
            <Button variant="contained" href={routes.consultations} sx={{ flex: { xs: "1 1 180px", sm: "0 0 auto" } }}>
              Намери подкрепа
            </Button>
            <Button variant="outlined" href={routes.events} sx={{ flex: { xs: "1 1 180px", sm: "0 0 auto" } }}>
              Предстоящи събития
            </Button>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary", letterSpacing: "0.04em" }}>
            ПОДКРЕПА · ЗНАНИЕ · ВЗАИМОПОМОЩ
          </Typography>
        </Box>

        {/* Image placeholder from Figma; replace with an approved photo. */}
        <Box
          sx={{
            bgcolor: "brand.sageLight",
            border: "1px solid #C2D1B8",
            borderRadius: { xs: "20px", md: "28px" },
            // On phones it stays a short quote card so the topics below show up sooner.
            minHeight: { xs: 0, md: 380 },
            p: { xs: 2.5, md: 3.5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Box aria-hidden sx={{ display: { xs: "none", md: "block" }, width: 120, height: 120, borderRadius: "50%", bgcolor: "brand.sage", mx: "auto" }} />
          <Typography
            component="p"
            sx={{ fontFamily: "var(--font-lora)", fontWeight: 500, fontSize: { xs: 22, md: 32 }, lineHeight: 1.2, color: "brand.dark" }}
          >
            Жените са по-силни
            <br />
            когато са заедно.
          </Typography>
        </Box>
      </Box>
    </Section>
  );
}
