import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { MoveButtons } from "@/components/admin/MoveButtons";
import { StatusChip } from "@/components/admin/StatusChip";
import { moveTeamMember } from "@/lib/admin/actions";
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
    .order("sort_order")
    .order("full_name");
  const rows = data ?? [];
  // Arrows move people within their group, in the same order as on the public page.
  const groupOf = (i: number) => rows[i]?.member_group;
  return (
    <>
      <AdminPageHeader
        title="Учредители и екип"
        description="Хората на страницата „Учредители“. Новите се публикуват веднага и отиват най-отдолу в групата си; със стрелките ги подреждаш."
        action={{ label: "Нов човек", href: newPath(adminRoutes.team) }}
      />
      <DataTable
        rows={rows.map((r, i) => ({ ...r, isFirst: groupOf(i - 1) !== r.member_group, isLast: groupOf(i + 1) !== r.member_group }))}
        rowKey={(r) => r.id}
        empty="Още няма добавени хора."
        columns={[
          { label: "Име", render: (r) => <Link href={itemPath(adminRoutes.team, r.id)}>{r.full_name}</Link> },
          { label: "Роля", render: (r) => r.role_title ?? "—" },
          { label: "Група", render: (r) => teamGroupLabels[r.member_group as keyof typeof teamGroupLabels] ?? r.member_group },
          {
            label: "Подредба",
            nowrap: true,
            render: (r) => <MoveButtons name={r.full_name} move={moveTeamMember.bind(null, r.id)} isFirst={r.isFirst} isLast={r.isLast} />,
          },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_published ? { label: "Публикуван", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
