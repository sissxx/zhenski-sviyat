import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

/** While a profile section loads, the greeting and the section menu stay on screen; only this part waits. */
export default function AccountLoading() {
  return (
    <Box role="status" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4 }}>
      <CircularProgress aria-hidden size={24} />
      <Typography sx={{ color: "text.secondary" }}>Зареждане…</Typography>
    </Box>
  );
}
