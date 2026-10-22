import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { teamGroupLabels } from "@/lib/admin/forms";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Учредители и екип" };

export default async function AdminTeamPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("team_members")
    .select("id, full_name, role_title, member_group, is_published")
    .order("member_group")
    .order("sort_order");
  return (
    <>
      <AdminPageHeader
        title="Учредители и екип"
        description="Хората на страницата „Учредители“."
        action={{ label: "Нов човек", href: newPath(adminRoutes.team) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма добавени хора."
        columns={[
          { label: "Име", render: (r) => <Link href={itemPath(adminRoutes.team, r.id)}>{r.full_name}</Link> },
          { label: "Роля", render: (r) => r.role_title ?? "—" },
          { label: "Група", render: (r) => teamGroupLabels[r.member_group as keyof typeof teamGroupLabels] ?? r.member_group },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_published ? { label: "Публикуван", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
