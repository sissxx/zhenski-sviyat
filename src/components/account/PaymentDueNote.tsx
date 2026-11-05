import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { formatDateTime, formatPrice } from "@/lib/locale";

type PaymentDueNoteProps = {
  amountCents: number;
  /** Until when the place or time is held; after that it is released. */
  deadline: string | null;
  /** The bank transfer reference, when paying by transfer. */
  reference?: string | null;
};

/** Highlighted "still to pay" line on a registration, booking or membership that waits for payment. */
export function PaymentDueNote({ amountCents, deadline, reference }: PaymentDueNoteProps) {
  return (
    <Box
      sx={{
        alignSelf: "stretch",
        borderRadius: "12px",
        bgcolor: "brand.terracottaLight",
        borderLeft: "3px solid",
        borderLeftColor: "secondary.main",
        px: 1.75,
        py: 1.25,
      }}
    >
      <Typography variant="body2" sx={{ color: "secondary.dark", fontWeight: 600 }}>
        Остава да платиш {formatPrice(amountCents)}
        {deadline && (
          <>
            {" "}до <time dateTime={deadline}>{formatDateTime(deadline)}</time>
          </>
        )}
        .
      </Typography>
      {reference && (
        <Typography variant="body2" sx={{ color: "secondary.dark" }}>
          Основание за превода:{" "}
          <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
            {reference}
          </Box>
        </Typography>
      )}
    </Box>
  );
}
