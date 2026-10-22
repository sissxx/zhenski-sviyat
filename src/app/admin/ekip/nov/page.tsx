import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Нов човек" };

export default function NewTeamMemberPage() {
  return <EntityNewPage entity="teamMember" title="Нов човек в екипа" backLabel="Учредители и екип" />;
}
