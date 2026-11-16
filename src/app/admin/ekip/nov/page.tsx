import type { Metadata } from "next";
import { EntityNewPage } from "@/components/admin/EntityPages";
import { specialistOptions } from "@/lib/admin/specialist-options";

export const metadata: Metadata = { title: "Нов човек" };

export default async function NewTeamMemberPage() {
  return <EntityNewPage entity="teamMember" title="Нов човек в екипа" backLabel="Учредители и екип" fieldOptions={await specialistOptions()} />;
}
