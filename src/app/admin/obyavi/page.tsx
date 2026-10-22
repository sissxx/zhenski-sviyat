import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/locale";

export const metadata: Metadata = { title: "Обяви" };

export default async function AdminAnnouncementsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, starts_at, ends_at, is_published")
    .order("created_at", { ascending: false });
  return (
    <>
      <AdminPageHeader
        title="Обяви"
        description="Кратки съобщения за сайта, с период на показване."
        action={{ label: "Нова обява", href: newPath(adminRoutes.announcements) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма обяви."
        columns={[
          { label: "Заглавие", render: (r) => <Link href={itemPath(adminRoutes.announcements, r.id)}>{r.title}</Link> },
          { label: "От", render: (r) => (r.starts_at ? formatDateTime(r.starts_at) : "—"), nowrap: true },
          { label: "До", render: (r) => (r.ends_at ? formatDateTime(r.ends_at) : "—"), nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_published ? { label: "Публикувана", tone: "success" } : { label: "Скрита" })} /> },
        ]}
      />
    </>
  );
}
