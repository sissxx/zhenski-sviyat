import Alert, { type AlertColor } from "@mui/material/Alert";
import type { ReactNode } from "react";

/** Result message under a form: an error from the server, or a success note. */
export function FormAlert({ severity, children }: { severity: AlertColor; children: ReactNode }) {
  return (
    <Alert severity={severity} role={severity === "error" ? "alert" : "status"} sx={{ width: "100%", borderRadius: "10px" }}>
      {children}
    </Alert>
  );
}
