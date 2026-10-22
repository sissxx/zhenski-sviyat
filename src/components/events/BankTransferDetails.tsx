import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Panel } from "@/components/ui/Panel";
import { Placeholder } from "@/components/ui/Placeholder";
import { formatDateTime, formatPrice } from "@/lib/locale";

type BankDetails = { beneficiary: string | null; iban: string | null; bic: string | null; bankName: string | null } | null;

type BankTransferDetailsProps = {
  amountCents: number;
  reference: string | null;
  deadline: string | null;
  /** From app_settings; until an admin fills it in, placeholders are shown. */
  bank: BankDetails;
  /** What is released when the deadline passes: "мястото" (events) or "часът" (consultations). */
  subject?: string;
};

/** What to put on the bank transfer: amount, reference, deadline and the association's account. */
export function BankTransferDetails({ amountCents, reference, deadline, bank, subject = "мястото" }: BankTransferDetailsProps) {
  const rows: { term: string; value: string | null; mono?: boolean }[] = [
    { term: "Сума", value: formatPrice(amountCents) },
    { term: "Основание", value: reference, mono: true },
    { term: "Получател", value: bank?.beneficiary ?? null },
    { term: "IBAN", value: bank?.iban ?? null, mono: true },
    { term: "BIC", value: bank?.bic ?? null, mono: true },
    { term: "Банка", value: bank?.bankName ?? null },
    { term: "Срок за плащане", value: deadline ? formatDateTime(deadline) : null },
  ];
  const missingAccount = !bank?.iban;

  return (
    <Panel aria-labelledby="bank-title" sx={{ width: "100%" }}>
      <Typography id="bank-title" variant="h6" component="h3">
        Данни за банков превод
      </Typography>
      <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" }, columnGap: 2, rowGap: 0.75 }}>
        {rows
          .filter((row) => row.value)
          .map((row) => (
            <Box key={row.term} sx={{ display: "contents" }}>
              <Typography component="dt" sx={{ fontSize: 14, color: "text.secondary" }}>
                {row.term}
              </Typography>
              <Typography
                component="dd"
                sx={{ m: 0, fontSize: 14, fontWeight: 600, overflowWrap: "anywhere", ...(row.mono && { fontFamily: "monospace", fontSize: 15 }) }}
              >
                {row.value}
              </Typography>
            </Box>
          ))}
      </Box>
      {missingAccount && <Placeholder>Получател, IBAN и BIC на сдружението.</Placeholder>}
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Напиши основанието точно както е показано, за да свържем превода със заявката ти. Ако преводът не пристигне до
        крайния срок, {subject} се освобождава.
      </Typography>
    </Panel>
  );
}
