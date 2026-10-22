import Alert from "@mui/material/Alert";
import type { ReactNode } from "react";

/**
 * Shown after a valid submit on forms that have no backend yet, so nobody
 * thinks their message, booking or payment went through.
 */
export function NotConnectedNotice({ children }: { children: ReactNode }) {
  return (
    <Alert severity="info" role="status" sx={{ width: "100%", borderRadius: "10px" }}>
      {children}
    </Alert>
  );
}
