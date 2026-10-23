import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsSections } from "@/content/legal/terms";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata("terms");

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Правна информация"
      title="Общи условия"
      lead="Условията за ползване на сайта, профилите, събитията, консултациите и членството."
      sections={termsSections}
    />
  );
}
