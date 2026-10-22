import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Видове консултации" };

export default async function AdminConsultationTypesPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("consultation_types")
    .select("id, name, duration_minutes, price_cents, requires_prepayment, is_active, specialist_consultation_types(specialist_id)")
    .order("sort_order")
    .order("name");
  return (
    <>
      <AdminPageHeader
        title="Видове консултации"
        description="Услугите, които могат да се запазват: продължителност, цена и плащане. Кой специалист какво предлага се избира в профила на специалиста."
        action={{ label: "Нов вид", href: newPath(adminRoutes.consultationTypes) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма видове консултации."
        columns={[
          { label: "Име", render: (r) => <Link href={itemPath(adminRoutes.consultationTypes, r.id)}>{r.name}</Link> },
          { label: "Продължителност", render: (r) => `${r.duration_minutes} мин.`, nowrap: true },
          {
            label: "Цена",
            nowrap: true,
            render: (r) => (r.price_cents ? `${formatPrice(r.price_cents)}${r.requires_prepayment ? "" : " на място"}` : "Безплатна"),
          },
          { label: "Специалисти", render: (r) => r.specialist_consultation_types.length, align: "right" },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_active ? { label: "Активна", tone: "success" } : { label: "Скрита" })} /> },
        ]}
      />
    </>
  );
}
