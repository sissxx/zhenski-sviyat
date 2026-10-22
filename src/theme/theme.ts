"use client";

import NextLink from "next/link";
import { createTheme } from "@mui/material/styles";
import { bgBG } from "@mui/material/locale";
import { brand } from "./tokens";

declare module "@mui/material/styles" {
  interface Palette {
    brand: typeof brand;
    onDark: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: typeof brand;
    onDark?: PaletteOptions["primary"];
  }
  interface TypographyVariants {
    eyebrow: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    eyebrow?: React.CSSProperties;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    onDark: true;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    eyebrow: true;
  }
}

const headingFont = "var(--font-lora), Georgia, 'Times New Roman', serif";
const bodyFont = "var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const theme = createTheme(
  {
    cssVariables: true,
    palette: {
      mode: "light",
      primary: { main: brand.primary, dark: "#00401F", light: "#2E7552", contrastText: brand.paper },
      secondary: { main: brand.dark, contrastText: brand.paper },
      // Light button for use on green panels (white fill, green label).
      onDark: { main: brand.paper, dark: brand.mint, light: brand.paper, contrastText: brand.primary },
      text: { primary: brand.text, secondary: brand.muted },
      background: { default: brand.bg, paper: brand.paper },
      divider: brand.divider,
      brand,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: bodyFont,
      h1: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 0.95, fontSize: "clamp(2.75rem, 7vw, 4.5rem)" },
      h2: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 1.2, fontSize: "clamp(1.625rem, 3.5vw, 2.25rem)" },
      h3: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 1.25, fontSize: "clamp(1.5rem, 3vw, 1.875rem)" },
      h4: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 1.3, fontSize: "1.4375rem" },
      h5: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 1.3, fontSize: "1.25rem" },
      h6: { fontFamily: headingFont, fontWeight: 700, color: brand.dark, lineHeight: 1.3, fontSize: "1.125rem" },
      subtitle1: { fontSize: "1.125rem", lineHeight: 1.5 },
      body1: { fontSize: "0.9375rem", lineHeight: 1.5 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      caption: { fontSize: "0.75rem", lineHeight: 1.45, color: brand.muted },
      button: { fontWeight: 600, fontSize: "0.875rem", textTransform: "none", letterSpacing: 0 },
      eyebrow: {
        fontFamily: bodyFont,
        fontWeight: 600,
        fontSize: "0.75rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: brand.accent,
        display: "block",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { WebkitFontSmoothing: "antialiased" },
          "a:focus-visible, button:focus-visible": {
            outline: `2px solid ${brand.primary}`,
            outlineOffset: 2,
          },
        },
      },
      // Buttons and list items with an href navigate client-side through next/link.
      MuiButtonBase: {
        defaultProps: { LinkComponent: NextLink },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: 44,
            minWidth: 180,
            paddingInline: 20,
            borderRadius: 12,
          },
          outlined: {
            backgroundColor: brand.paper,
            borderColor: brand.primary,
            "&:hover": { backgroundColor: brand.mint },
          },
        },
      },
      MuiLink: {
        defaultProps: { underline: "hover" },
      },
      MuiTypography: {
        defaultProps: {
          variantMapping: { eyebrow: "p", subtitle1: "p", subtitle2: "p" },
        },
      },
      // Form inputs as in the Figma forms: cream fill, light border, 8px corners.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: brand.bg,
            borderRadius: 8,
            fontSize: "0.875rem",
            "& .MuiOutlinedInput-notchedOutline": { borderColor: brand.divider },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: brand.accent },
          },
          input: { paddingBlock: 12, paddingInline: 14 },
          multiline: { padding: 0 },
        },
      },
      MuiFormHelperText: {
        styleOverrides: { root: { marginInline: 0, fontSize: "0.8125rem" } },
      },
      MuiAccordion: {
        defaultProps: { disableGutters: true, elevation: 0, square: false },
        styleOverrides: {
          root: {
            backgroundColor: brand.paper,
            borderRadius: 8,
            "&::before": { display: "none" },
          },
        },
      },
    },
  },
  bgBG,
);

export default theme;
