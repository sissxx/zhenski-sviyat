import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";

export const metadata: Metadata = { title: "Учредители и екип" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditTeamMemberPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  return (
    <EntityEditPage
      entity="teamMember"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.full_name)}
      backLabel="Учредители и екип"
      deleteConfirm="Профилът ще бъде изтрит завинаги."
    />
  );
}
