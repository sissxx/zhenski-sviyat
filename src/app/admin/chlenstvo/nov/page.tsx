import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов план" };

export default function NewPlanPage() {
  return <EntityNewPage entity="plan" title="Нов план" backLabel="Членство и планове" />;
}
