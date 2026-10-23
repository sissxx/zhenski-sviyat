import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { Section } from "@/components/ui/Section";

/** Shown while a page that reads the database loads, so a click never looks ignored. */
export default function Loading() {
  return (
    <Section bg="background.default" sx={{ py: { xs: 10, md: 16 }, textAlign: "center" }}>
      <div role="status">
        <CircularProgress aria-hidden size={36} />
        <Typography sx={{ mt: 2, color: "text.secondary" }}>Зареждане…</Typography>
      </div>
    </Section>
  );
}
