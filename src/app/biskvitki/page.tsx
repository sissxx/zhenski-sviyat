import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookieSections } from "@/content/legal/cookies";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("cookies");

export default function CookiesPage() {
  return (
    <LegalDocument
      eyebrow="Правна информация"
      title="Политика за бисквитките"
      lead="Кои бисквитки използва сайтът и защо."
      sections={cookieSections}
    />
  );
}
