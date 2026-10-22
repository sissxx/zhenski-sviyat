import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нова промоция" };

export default function NewPromotionPage() {
  return <EntityNewPage entity="promotion" title="Нова промоция" backLabel="Промоции" />;
}
