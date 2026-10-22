"use client";

import NextLink from "next/link";
import Link, { type LinkProps } from "@mui/material/Link";

type AppLinkProps = Omit<LinkProps, "href" | "component"> & { href: string };

/** MUI Link that navigates client-side; usable from server components. */
export function AppLink(props: AppLinkProps) {
  return <Link component={NextLink} {...props} />;
}

/** Link inside a sentence: always underlined so it doesn't rely on colour alone (WCAG 1.4.1). */
export function TextLink(props: AppLinkProps) {
  return <Link component={NextLink} underline="always" {...props} />;
}
