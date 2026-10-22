import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Специалисти" };

export default async function AdminSpecialistsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("specialists")
    .select("id, full_name, title, is_active, user_id, specialist_consultation_types(consultation_types(name)), specialist_availability(id)")
    .order("sort_order")
    .order("full_name");
  return (
    <>
      <AdminPageHeader
        title="Специалисти"
        description="Профилите на специалистите, какви консултации предлагат и работното им време."
        action={{ label: "Нов специалист", href: newPath(adminRoutes.specialists) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма специалисти."
        columns={[
          { label: "Име", render: (r) => <Link href={itemPath(adminRoutes.specialists, r.id)}>{r.full_name}</Link> },
          { label: "Специалност", render: (r) => r.title ?? "—" },
          {
            label: "Консултации",
            render: (r) => r.specialist_consultation_types.map((t) => t.consultation_types?.name).filter(Boolean).join(", ") || "—",
          },
          {
            label: "График",
            render: (r) => (r.specialist_availability.length ? `${r.specialist_availability.length} интервала` : <StatusChip label="Няма" tone="warning" />),
          },
          { label: "Вход", render: (r) => (r.user_id ? "Има профил" : "—") },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_active ? { label: "Активен", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
