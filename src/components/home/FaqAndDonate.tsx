import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { AppLink } from "@/components/ui/AppLink";
import Typography from "@mui/material/Typography";
import { faqPreview } from "@/content/home";
import { routes } from "@/lib/routes";

const panelPadding = { px: { xs: 2, sm: 3, md: 7 }, py: { xs: 5, md: 7 } };

function PlusIcon() {
  return (
    <Box component="span" aria-hidden sx={{ fontSize: 18, lineHeight: 1, color: "brand.dark", width: 14, textAlign: "center" }}>
      +
    </Box>
  );
}

export function FaqAndDonate() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Box component="section" aria-labelledby="faq-title" sx={{ bgcolor: "brand.sand", ...panelPadding }}>
        <Box sx={{ maxWidth: 600, ml: { md: "auto" }, display: "flex", flexDirection: "column", gap: 1.75 }}>
          <Typography variant="eyebrow">Имаш въпроси?</Typography>
          <Typography id="faq-title" variant="h3" component="h2">
            Често задавани въпроси
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {faqPreview.map((item, index) => (
              <Accordion
                key={item.question}
                sx={{ "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(45deg)" } }}
              >
                <AccordionSummary
                  expandIcon={<PlusIcon />}
                  id={`faq-${index}-header`}
                  aria-controls={`faq-${index}-content`}
                  sx={{ minHeight: 44, "& .MuiAccordionSummary-content": { my: 1.25 } }}
                >
                  <Typography component="h3" sx={{ fontWeight: 500, fontSize: 14 }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
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
          <Typography sx={{ fontSize: 13, color: "brand.sage" }}>
            <AppLink href={routes.contacts} sx={{ color: "inherit" }}>
              Контактна форма
            </AppLink>
            {" · Национален телефон"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
