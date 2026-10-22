"use client";

import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { AppLink } from "@/components/ui/AppLink";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import SvgIcon from "@mui/material/SvgIcon";
import Toolbar from "@mui/material/Toolbar";
import { WomensWorldLogo } from "@/components/brand/Logo";
import { useSignedIn } from "@/components/auth/useSignedIn";
import { mainNav, routes } from "@/lib/routes";
import { site } from "@/lib/site";

function MenuIcon() {
  return (
    <SvgIcon>
      <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
    </SvgIcon>
  );
}

function CloseIcon() {
  return (
    <SvgIcon>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </SvgIcon>
  );
}

const isActive = (pathname: string, href: string) =>
  href === routes.home ? pathname === href : pathname.startsWith(href);

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: "background.paper", color: "text.primary", borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar
        component="nav"
        aria-label="Основна навигация"
        sx={{ justifyContent: "space-between", gap: 2, px: { xs: 2, sm: 3, xl: 7.5 }, py: { xs: 1, lg: 3 } }}
      >
        <AppLink
          href={routes.home}
          underline="none"
          aria-label={`${site.name}, начална страница`}
          sx={{ display: "flex", alignItems: "center", color: "inherit" }}
        >
          <WomensWorldLogo />
        </AppLink>

        <Box component="ul" sx={{ display: { xs: "none", lg: "flex" }, gap: 2.25, listStyle: "none", m: 0, p: 0 }}>
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <AppLink
                 
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? "brand.dark" : "text.primary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </AppLink>
              </li>
            );
          })}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {signedIn ? (
            <Button variant="contained" href={routes.account} sx={{ display: { xs: "none", md: "inline-flex" } }}>
              Моят профил
            </Button>
          ) : (
            <>
              <Button
                variant="text"
                href={routes.login}
                sx={{ display: { xs: "none", md: "inline-flex" }, whiteSpace: "nowrap" }}
              >
                Вход
              </Button>
              <Button
                variant="contained"
                href={routes.register}
                sx={{ display: { xs: "none", md: "inline-flex" } }}
              >
                Стани част от нас
              </Button>
            </>
          )}
          <IconButton
            aria-label="Отвори менюто"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            sx={{ display: { lg: "none" }, color: "brand.dark" }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Drawer
        id="mobile-menu"
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: "min(320px, 85vw)", bgcolor: "background.paper" } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton aria-label="Затвори менюто" onClick={() => setOpen(false)} sx={{ color: "brand.dark" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List component="nav" aria-label="Мобилна навигация" sx={{ px: 1 }}>
          {mainNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <ListItemButton
                key={item.href}
                component={NextLink}
                href={item.href}
                selected={active}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                sx={{ borderRadius: "8px" }}
              >
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontWeight: active ? 600 : 500, color: "brand.dark" } } }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{ p: 2, display: "grid", gap: 1 }}>
          {signedIn ? (
            <Button variant="contained" fullWidth href={routes.account} onClick={() => setOpen(false)}>
              Моят профил
            </Button>
          ) : (
            <>
              <Button variant="contained" fullWidth href={routes.register} onClick={() => setOpen(false)}>
                Стани част от нас
              </Button>
              <Button variant="outlined" fullWidth href={routes.login} onClick={() => setOpen(false)}>
                Вход
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
}
