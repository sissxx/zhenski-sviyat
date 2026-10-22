import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LegalPlaceholder } from "@/components/legal/LegalPlaceholder";
import { TextLink } from "@/components/ui/AppLink";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Политика за поверителност",
  description: "Как Сдружение Женски свят събира, използва и пази личните данни.",
};

// Draft summary written for the placeholder; the association's final policy replaces it.
const points = [
  "Събираме само данните, нужни за профила, записванията, консултациите и членството: име, имейл, телефон и история на плащанията.",
  "Данните за картите се обработват от платежния доставчик. Ние не ги съхраняваме.",
  "Не продаваме и не предоставяме личните ти данни на трети страни за реклама.",
  "Новини по имейл получаваш само ако си се съгласила. Можеш да се откажеш по всяко време от профила си.",
  "Можеш да поискаш достъп до данните си, тяхната поправка или изтриване на профила.",
];

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      eyebrow="Правна информация"
      title="Политика за поверителност"
      lead="Тук ще бъде публикувана пълната политика за обработване на лични данни на сдружението."
    >
      <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
        {points.map((point) => (
          <Typography component="li" key={point}>
            {point}
          </Typography>
        ))}
      </Box>
      <Typography>
        Въпроси за личните данни можеш да ни изпратиш чрез <TextLink href={routes.contacts}>страницата за контакти</TextLink>.
      </Typography>
    </LegalPlaceholder>
  );
}
