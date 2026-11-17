"use client";

import { useSyncExternalStore } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { TextLink } from "@/components/ui/AppLink";
import { cookieNoticeStorageKey } from "@/lib/legal";
import { routes } from "@/lib/routes";

// The notice only informs: the site sets strictly necessary cookies, which need no consent.
// Closing it is remembered in localStorage; private windows or blocked storage just show it again.
const listeners = new Set<() => void>();
let dismissedThisView = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isDismissed(): boolean {
  try {
    return window.localStorage.getItem(cookieNoticeStorageKey) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(cookieNoticeStorageKey, "1");
  } catch {
    // Storage blocked: the notice closes for this page view only.
  }
  dismissedThisView = true;
  listeners.forEach((listener) => listener());
}

/** Small bar at the bottom of the page saying the site uses only necessary cookies. */
export function CookieNotice() {
  // The server renders nothing, so the bar never flashes for visitors who already closed it.
  const hidden = useSyncExternalStore(subscribe, () => dismissedThisView || isDismissed(), () => true);
  if (hidden) return null;

  return (
    <Box
      role="region"
      aria-label="Бисквитки"
      sx={{
        position: "fixed",
        zIndex: 1200,
        // Phones: a slim full-width strip at the very bottom, so it never covers the page's buttons.
        left: { xs: 0, sm: 24 },
        right: { xs: 0, sm: "auto" },
        bottom: { xs: 0, sm: 24 },
        maxWidth: { sm: 480 },
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        px: 2,
        py: { xs: 1, sm: 2 },
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: { xs: 0, sm: "14px" },
        boxShadow: "0 8px 24px rgba(31, 69, 54, 0.16)",
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, fontSize: { xs: 13, sm: 14 } }}>
        Ползваме само необходими бисквитки, без реклами и проследяване.{" "}
        <TextLink href={routes.cookies}>Научи повече</TextLink>
      </Typography>
      <Button variant="contained" size="small" onClick={dismiss} sx={{ flexShrink: 0, minWidth: 0 }}>
        Разбрах
      </Button>
    </Box>
  );
}
