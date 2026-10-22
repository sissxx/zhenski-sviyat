import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppLink, TextLink } from "@/components/ui/AppLink";
import Typography from "@mui/material/Typography";
import { FaqList } from "@/components/faq/FaqList";
import { faqs } from "@/content/faq";
import { routes } from "@/lib/routes";

const panelPadding = { px: { xs: 2, sm: 3, md: 7 }, py: { xs: 5, md: 7 } };

export function FaqAndDonate() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Box component="section" aria-labelledby="faq-title" sx={{ bgcolor: "brand.sand", ...panelPadding }}>
        <Box sx={{ maxWidth: 600, ml: { md: "auto" }, display: "flex", flexDirection: "column", gap: 1.75 }}>
          <Typography variant="eyebrow">Имаш въпроси?</Typography>
          <Typography id="faq-title" variant="h3" component="h2">
            Често задавани въпроси
          </Typography>
          <FaqList items={faqs.slice(0, 5)} idPrefix="faq" />
          <AppLink href={routes.faq} sx={{ fontWeight: 600, fontSize: 14, alignSelf: "flex-start" }}>
            Всички въпроси
          </AppLink>
        </Box>
      </Box>

      <Box component="section" aria-labelledby="donate-title" sx={{ bgcolor: "primary.main", color: "brand.paper", ...panelPadding }}>
        <Box sx={{ maxWidth: 600, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2.25 }}>
          <Typography variant="eyebrow" sx={{ color: "brand.sage" }}>
            Подкрепи ни
          </Typography>
          <Typography id="donate-title" variant="h2" sx={{ color: "brand.paper", lineHeight: 1.1 }}>
            Бъди част от промяната.
          </Typography>
          <Typography sx={{ color: "brand.paper" }}>
            Всяко дарение помага да развиваме инициативи, да създаваме събития и да подкрепяме повече жени.
          </Typography>
          {/* Figma had a green button on the green panel (invisible); the light variant fixes that. */}
          <Button variant="contained" color="onDark" href={routes.support}>
            Направи дарение
          </Button>
          {/* The national phone number isn't published yet; both live on the contacts page. */}
          <TextLink href={routes.contacts} sx={{ fontSize: 13, color: "brand.sage" }}>
            Контактна форма и национален телефон
          </TextLink>
        </Box>
      </Box>
    </Box>
  );
}
