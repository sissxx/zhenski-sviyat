import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов въпрос" };

export default function NewFaqPage() {
  return <EntityNewPage entity="faq" title="Нов въпрос" backLabel="Въпроси" />;
}
