import Chip from "@mui/material/Chip";

export type Tone = "neutral" | "success" | "warning" | "error" | "info";

const colors: Record<Tone, "default" | "success" | "warning" | "error" | "info"> = {
  neutral: "default",
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
};

/** Small coloured status label in admin tables. */
export function StatusChip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <Chip size="small" label={label} color={colors[tone]} variant={tone === "neutral" ? "outlined" : "filled"} />;
}
