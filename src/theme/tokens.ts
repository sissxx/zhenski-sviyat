/**
 * Brand colours read from the Figma file (3GtcvnBU9j1MEZcpXnw2Tn). The file has
 * no variables or styles, so these are the raw values used across its frames.
 */
export const brand = {
  primary: "#00552F",
  dark: "#1F4536",
  text: "#1F2E26",
  muted: "#5C6B5E",
  bg: "#FBF9F0",
  paper: "#FFFFFC",
  mint: "#EDF2E5",
  /** Pale band behind lists and forms on inner pages. */
  mintLight: "#F2F5EC",
  sand: "#F6F1E6",
  divider: "#DBE3D4",
  /** Eyebrow labels ("ЗА СДРУЖЕНИЕТО", "МЕСЕЧНО ЧЛЕНСТВО"). */
  accent: "#335C47",
  /** Image placeholders and light text on green panels. */
  sage: "#C7D4BF",
  sageLight: "#D6E2CF",
  /** "Нашата общност" band. */
  moss: "#E5EDDF",
  /** Cards on white sections. */
  card: "#F8F6EE",
  cardBorder: "#D5DFCD",
  /**
   * Terracotta accent, used sparingly next to the greens: eyebrow labels, the main sign-up and donate calls to
   * action, small icons and markers, and the active-page indicator. 5.1:1 or more on every light background
   * here (WCAG AA for normal text), so it is safe for text as well as fills with a light label.
   */
  terracotta: "#A8482C",
  /** Hover and pressed state of terracotta buttons. */
  terracottaDark: "#8A3A22",
  /** Pale terracotta tint for soft highlights behind dark text. */
  terracottaLight: "#F6E4DA",
  /** Light terracotta for text on the dark green footer and panels (5.9:1 on brand.dark). */
  terracottaSoft: "#EBB49C",
} as const;
