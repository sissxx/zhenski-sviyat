import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Ново събитие" };

export default function NewEventPage() {
  return <EntityNewPage entity="event" title="Ново събитие" backLabel="Събития" />;
}
