import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нова обява" };

export default function NewAnnouncementPage() {
  return <EntityNewPage entity="announcement" title="Нова обява" backLabel="Обяви" />;
}
