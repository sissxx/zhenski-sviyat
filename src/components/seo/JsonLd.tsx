import { serializeJsonLd } from "@/lib/seo/structured-data";

/** Structured data for search engines (see src/lib/seo/structured-data.ts). */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
