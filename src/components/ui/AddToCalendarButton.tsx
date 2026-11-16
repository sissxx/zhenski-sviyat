import Button from "@mui/material/Button";

/** Downloads a calendar file (.ics) that phones and Google/Apple/Outlook calendars open as a new entry. */
export function AddToCalendarButton({ href, size }: { href: string; size?: "small" | "medium" }) {
  return (
    <Button variant="outlined" size={size} href={href} download sx={{ alignSelf: "flex-start" }}>
      Добави в календара
    </Button>
  );
}
