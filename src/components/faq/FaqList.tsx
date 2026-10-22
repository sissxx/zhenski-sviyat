import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type FaqItem = { question: string; answer: string };

function PlusIcon() {
  return (
    <Box component="span" aria-hidden sx={{ fontSize: 18, lineHeight: 1, color: "brand.dark", width: 14, textAlign: "center" }}>
      +
    </Box>
  );
}

/** Accordion of questions; `idPrefix` keeps ids unique when two lists share a page. */
export function FaqList({ items, idPrefix, striped = false }: { items: FaqItem[]; idPrefix: string; striped?: boolean }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {items.map((item, index) => (
        <Accordion
          key={item.question}
          sx={{
            ...(striped && index % 2 === 0 && { bgcolor: "brand.mint" }),
            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(45deg)" },
          }}
        >
          <AccordionSummary
            expandIcon={<PlusIcon />}
            id={`${idPrefix}-${index}-header`}
            aria-controls={`${idPrefix}-${index}-content`}
            sx={{ minHeight: 48, "& .MuiAccordionSummary-content": { my: 1.25 } }}
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
  );
}
