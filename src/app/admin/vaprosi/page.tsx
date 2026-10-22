import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Въпроси" };

export default async function AdminFaqsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("faqs").select("id, question, category, sort_order, is_published").order("sort_order").order("created_at");
  return (
    <>
      <AdminPageHeader
        title="Често задавани въпроси"
        description="Въпросите на страницата „Често задавани въпроси“. Непубликуваните не се виждат на сайта."
        action={{ label: "Нов въпрос", href: newPath(adminRoutes.faqs) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма въпроси."
        columns={[
          { label: "Въпрос", render: (r) => <Link href={itemPath(adminRoutes.faqs, r.id)}>{r.question}</Link> },
          { label: "Категория", render: (r) => r.category ?? "—" },
          { label: "Подредба", render: (r) => r.sort_order, align: "right" },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_published ? { label: "Публикуван", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
