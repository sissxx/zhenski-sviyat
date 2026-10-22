import { Inter, Lora } from "next/font/google";

export const lora = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-lora",
});

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});
