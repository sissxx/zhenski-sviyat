import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов специалист" };

export default function NewSpecialistPage() {
  return <EntityNewPage entity="specialist" title="Нов специалист" backLabel="Специалисти" />;
}
