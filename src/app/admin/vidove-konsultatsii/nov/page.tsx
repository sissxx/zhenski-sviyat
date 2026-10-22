import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов вид консултация" };

export default function NewConsultationTypePage() {
  return <EntityNewPage entity="consultationType" title="Нов вид консултация" backLabel="Видове консултации" />;
}
