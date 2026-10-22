import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов партньор" };

export default function NewPartnerPage() {
  return <EntityNewPage entity="partner" title="Нов партньор" backLabel="Партньори" />;
}
