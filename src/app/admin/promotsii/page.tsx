import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDate, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Промоции" };

export default async function AdminPromotionsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("promotions")
    .select("id, title, price_cents, valid_from, valid_until, is_published")
    .order("sort_order")
    .order("created_at", { ascending: false });
  const now = new Date().toISOString();
  return (
    <>
      <AdminPageHeader
        title="Пакети и промоции"
        description="Карти на страницата „Пакети и промоции“. Изтеклите се скриват сами."
        action={{ label: "Нова промоция", href: newPath(adminRoutes.promotions) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма промоции."
        columns={[
          { label: "Заглавие", render: (r) => <Link href={itemPath(adminRoutes.promotions, r.id)}>{r.title}</Link> },
          { label: "Цена", render: (r) => (r.price_cents === null ? "—" : formatPrice(r.price_cents)), nowrap: true },
          {
            label: "Валидна",
            nowrap: true,
            render: (r) =>
              r.valid_from || r.valid_until
                ? `${r.valid_from ? formatDate(r.valid_from) : "…"} – ${r.valid_until ? formatDate(r.valid_until) : "…"}`
                : "Без срок",
          },
          {
            label: "Статус",
            render: (r) =>
              !r.is_published ? (
                <StatusChip label="Скрита" />
              ) : r.valid_until && r.valid_until < now ? (
                <StatusChip label="Изтекла" />
              ) : (
                <StatusChip label="Публикувана" tone="success" />
              ),
          },
        ]}
      />
    </>
  );
}
