import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { partnerKindLabels } from "@/lib/admin/forms";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Партньори" };

export default async function AdminPartnersPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("partners").select("id, name, kind, website_url, sort_order, is_published").order("sort_order").order("name");
  return (
    <>
      <AdminPageHeader
        title="Партньори"
        description="Партньорите и организациите, които ни подкрепят, на страницата „Подкрепи ни“."
        action={{ label: "Нов партньор", href: newPath(adminRoutes.partners) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма партньори."
        columns={[
          { label: "Име", render: (r) => <Link href={itemPath(adminRoutes.partners, r.id)}>{r.name}</Link> },
          { label: "Вид", render: (r) => partnerKindLabels[r.kind as keyof typeof partnerKindLabels] ?? r.kind },
          { label: "Уебсайт", render: (r) => r.website_url ?? "—" },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_published ? { label: "Публикуван", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
