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
        left: { xs: 16, sm: 24 },
        right: { xs: 16, sm: "auto" },
        bottom: { xs: 16, sm: 24 },
        maxWidth: 480,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2,
        p: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "14px",
        boxShadow: "0 8px 24px rgba(31, 69, 54, 0.16)",
      }}
    >
      <Typography variant="body2" sx={{ flex: 1 }}>
        Сайтът използва само необходими бисквитки, за да работи входът в профила. Не използваме рекламни или
        аналитични бисквитки. <TextLink href={routes.cookies}>Научи повече</TextLink>
      </Typography>
      <Button variant="contained" size="small" onClick={dismiss} sx={{ flexShrink: 0, minWidth: { sm: 0 } }}>
        Разбрах
      </Button>
    </Box>
  );
}
