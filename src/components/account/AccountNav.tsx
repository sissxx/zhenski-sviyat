"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { accountNav, routes } from "@/lib/routes";
import { signOut } from "@/lib/auth/actions";

/** Section links of the account area: a column on desktop, a scrollable row on phones. */
export function AccountNav() {
  const pathname = usePathname() ?? routes.account;
  return (
    <Box component="nav" aria-label="Моят профил" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          gap: 0.75,
          overflowX: { xs: "auto", md: "visible" },
          pb: { xs: 0.5, md: 0 },
        }}
      >
        {accountNav.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Button
                component={NextLink}
                href={item.href}
                aria-current={active ? "page" : undefined}
                variant={active ? "contained" : "text"}
                sx={{ justifyContent: "flex-start", whiteSpace: "nowrap", width: { md: "100%" } }}
              >
                {item.label}
              </Button>
            </li>
          );
        })}
      </Box>
      <Box component="form" action={signOut} sx={{ display: { xs: "none", md: "block" } }}>
        <Button type="submit" variant="outlined" fullWidth>
          Изход
        </Button>
      </Box>
    </Box>
  );
}
