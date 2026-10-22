import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нова Viber група" };

export default function NewViberGroupPage() {
  return <EntityNewPage entity="viberGroup" title="Нова Viber група" backLabel="Viber достъп" />;
}
