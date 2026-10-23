import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LegalPlaceholder } from "@/components/legal/LegalPlaceholder";
import { TextLink } from "@/components/ui/AppLink";
import { routes } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("terms");

// Draft summary written for the placeholder; the association's final terms replace it.
const points = [
  "Профилът е личен. Пазиш паролата си и отговаряш за действията от профила.",
  "Записването за платено събитие или консултация е потвърдено, след като плащането бъде получено.",
  "Плащането по банков път се потвърждава от екипа. Дотогава мястото се пази за ограничено време.",
  "Членството се плаща месечно и може да бъде прекратено по всяко време. Достъпът остава до края на платения период.",
  "Сроковете за отказ и преместване на събития и консултации са посочени при записването.",
];

export default function TermsPage() {
  return (
    <LegalPlaceholder
      eyebrow="Правна информация"
      title="Общи условия"
      lead="Тук ще бъдат публикувани пълните общи условия за ползване на сайта и услугите на сдружението."
    >
      <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
        {points.map((point) => (
          <Typography component="li" key={point}>
            {point}
          </Typography>
        ))}
      </Box>
      <Typography>
        Въпроси можеш да ни изпратиш чрез <TextLink href={routes.contacts}>страницата за контакти</TextLink>.
      </Typography>
    </LegalPlaceholder>
  );
}
