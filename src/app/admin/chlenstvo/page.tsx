import type { Metadata } from "next";
import Link from "@mui/material/Link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { billingIntervalLabels } from "@/lib/admin/forms";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Членство и планове" };

export default async function AdminPlansPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("membership_plans")
    .select("id, name, price_cents, billing_interval, stripe_price_id, is_active, plan_viber_groups(viber_groups(name))")
    .order("sort_order")
    .order("name");
  return (
    <>
      <AdminPageHeader
        title="Членство и планове"
        description="Абонаментните планове, цените им и до кои Viber групи дават достъп."
        action={{ label: "Нов план", href: newPath(adminRoutes.plans) }}
      />
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Още няма планове."
        columns={[
          { label: "План", render: (r) => <Link href={itemPath(adminRoutes.plans, r.id)}>{r.name}</Link> },
          {
            label: "Цена",
            nowrap: true,
            render: (r) => `${formatPrice(r.price_cents)} · ${billingIntervalLabels[r.billing_interval].toLowerCase()}`,
          },
          { label: "Viber групи", render: (r) => r.plan_viber_groups.map((g) => g.viber_groups?.name).filter(Boolean).join(", ") || "—" },
          { label: "Карта", render: (r) => (r.stripe_price_id ? "Свързан със Stripe" : <StatusChip label="Без Stripe цена" tone="warning" />) },
          { label: "Статус", render: (r) => <StatusChip {...(r.is_active ? { label: "Активен", tone: "success" } : { label: "Скрит" })} /> },
        ]}
      />
    </>
  );
}
