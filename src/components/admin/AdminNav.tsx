"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { adminNav, adminRoutes } from "@/lib/admin/routes";

const isActive = (pathname: string, href: string) =>
  href === adminRoutes.home ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

/** Admin sections: grouped column on desktop, one scrollable row on phones. */
export function AdminNav() {
  const pathname = usePathname() ?? adminRoutes.home;
  return (
    <Box
      component="nav"
      aria-label="Администрация"
      sx={{
        display: "flex",
        flexDirection: { xs: "row", md: "column" },
        gap: { xs: 0.75, md: 2 },
        overflowX: { xs: "auto", md: "visible" },
        pb: { xs: 0.5, md: 0 },
        position: { md: "sticky" },
        top: { md: 96 },
      }}
    >
      {adminNav.map((group, index) => (
        <Box key={group.title || index} sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, gap: 0.5 }}>
          {group.title && (
            <Typography variant="eyebrow" sx={{ display: { xs: "none", md: "block" }, px: 1.5, mb: 0.25 }}>
              {group.title}
            </Typography>
          )}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Button
                key={item.href}
                component={NextLink}
                href={item.href}
                aria-current={active ? "page" : undefined}
                variant={active ? "contained" : "text"}
                size="small"
                sx={{ justifyContent: "flex-start", whiteSpace: "nowrap", minWidth: 0, minHeight: 38, width: { md: "100%" } }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
