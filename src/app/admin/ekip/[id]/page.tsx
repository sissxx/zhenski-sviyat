import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";
import { specialistOptions } from "@/lib/admin/specialist-options";

export const metadata: Metadata = { title: "Учредители и екип" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditTeamMemberPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }, fieldOptions] = await Promise.all([params, searchParams, specialistOptions()]);
  return (
    <EntityEditPage
      entity="teamMember"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.full_name)}
      backLabel="Учредители и екип"
      deleteConfirm="Профилът ще бъде изтрит завинаги."
      fieldOptions={fieldOptions}
    />
  );
}
