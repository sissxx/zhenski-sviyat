"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { accountNav, routes, type NavItem } from "@/lib/routes";
import { signOut } from "@/lib/auth/actions";

type AccountNavProps = {
  /** Sections after the usual ones, e.g. the specialist schedule. */
  extraItems?: NavItem[];
  /** How many things wait for the member in each section, keyed by link; shown as a badge. */
  attention?: Record<string, number>;
};

/**
 * Section links of the account area: a column on desktop, a two-column grid on phones so every
 * section (and the open one) is always in view.
 */
export function AccountNav({ extraItems = [], attention = {} }: AccountNavProps) {
  const pathname = usePathname() ?? routes.account;
  return (
    <Box component="nav" aria-label="Моят профил" sx={{ display: "flex", flexDirection: "column", gap: { xs: 1, md: 2 } }}>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "minmax(0, 1fr)" },
          gap: 0.75,
        }}
      >
        {[...accountNav, ...extraItems].map((item) => {
          // Sub-pages (e.g. moving a consultation) keep their section highlighted.
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const count = attention[item.href] ?? 0;
          return (
            <li key={item.href}>
              <Button
                component={NextLink}
                href={item.href}
                aria-current={active ? "page" : undefined}
                variant="text"
                color={active ? "secondary" : "primary"}
                sx={{
                  justifyContent: "space-between",
                  gap: 1,
                  width: "100%",
                  minWidth: 0,
                  minHeight: 44,
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                  textAlign: "left",
                  lineHeight: 1.25,
                  // Phones: each section is a soft tile; desktop: a plain list.
                  bgcolor: { xs: "background.paper", md: "transparent" },
                  border: { xs: "1px solid", md: "none" },
                  borderColor: "divider",
                  // Terracotta edge on the current page.
                  boxShadow: active ? "inset 3px 0 0 var(--mui-palette-secondary-main)" : undefined,
                  // The current page sits on a pale terracotta tint with darker terracotta text (6.3:1).
                  ...(active && {
                    bgcolor: "brand.terracottaLight",
                    color: "secondary.dark",
                    "&:hover": { bgcolor: "brand.terracottaLight" },
                  }),
                }}
              >
                <Box component="span" sx={{ minWidth: 0 }}>
                  {item.label}
                </Box>
                {count > 0 && (
                  <Box component="span" sx={visuallyHidden}>
                    {` (${count} ${count === 1 ? "чака" : "чакат"} плащане)`}
                  </Box>
                )}
                {count > 0 && (
                  <Box
                    component="span"
                    aria-hidden
                    title="Чака плащане"
                    sx={{
                      flexShrink: 0,
                      minWidth: 22,
                      height: 22,
                      px: 0.75,
                      borderRadius: 11,
                      bgcolor: "secondary.main",
                      color: "secondary.contrastText",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {count}
                  </Box>
                )}
              </Button>
            </li>
          );
        })}
      </Box>
      <Box component="form" action={signOut} sx={{ alignSelf: { xs: "flex-end", md: "stretch" } }}>
        <Button
          type="submit"
          variant="outlined"
          fullWidth
          sx={{ display: { xs: "none", md: "inline-flex" } }}
        >
          Изход
        </Button>
        <Button type="submit" variant="text" size="small" sx={{ display: { xs: "inline-flex", md: "none" } }}>
          Изход от профила
        </Button>
      </Box>
    </Box>
  );
}

/** Read by screen readers, not shown. */
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
} as const;
