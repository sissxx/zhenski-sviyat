import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacySections } from "@/content/legal/privacy";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("privacy");

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Правна информация"
      title="Политика за поверителност"
      lead="Как събираме, използваме и пазим личните ти данни и какви права имаш."
      sections={privacySections}
    />
  );
}
