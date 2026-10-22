import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { endBankTransferSubscription } from "@/lib/admin/actions";
import { personName, providerLabel, subscriptionStatus } from "@/lib/admin/labels";
import { adminRoutes, itemPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import type { Database } from "@/lib/supabase/database.types";
import { formatDate } from "@/lib/locale";

export const metadata: Metadata = { title: "Абонаменти" };

type Status = Database["public"]["Enums"]["subscription_status"];
const filters: { key: string; label: string; statuses: Status[] | null }[] = [
  { key: "aktivni", label: "Активни", statuses: ["active", "trialing", "past_due"] },
  { key: "chakat", label: "Чакат превод", statuses: ["pending_bank_transfer", "incomplete"] },
  { key: "vsichki", label: "Всички", statuses: null },
];

type Props = { searchParams: Promise<{ filtar?: string }> };

export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const { filtar } = await searchParams;
  const filter = filters.find((f) => f.key === filtar) ?? filters[0];
  let query = supabase
    .from("subscriptions")
    .select(
      "id, user_id, status, provider, current_period_end, cancel_at_period_end, created_at, profiles!subscriptions_user_id_fkey(first_name, last_name, email), membership_plans(name)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (filter.statuses) query = query.in("status", filter.statuses);
  const { data } = await query;

  return (
    <>
      <AdminPageHeader
        title="Абонаменти"
        description="Членствата на потребителите. Абонаментите с карта се управляват от Stripe; тези по банков път се подновяват, когато потвърдиш превода в „Плащания“."
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <Button
            key={f.key}
            size="small"
            variant={f === filter ? "contained" : "text"}
            href={`${adminRoutes.subscriptions}?filtar=${f.key}`}
            sx={{ minWidth: 0 }}
          >
            {f.label}
          </Button>
        ))}
      </Box>
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty="Няма абонаменти тук."
        columns={[
          {
            label: "Член",
            render: (r) => (
              <>
                <Link href={itemPath(adminRoutes.users, r.user_id)} sx={{ fontWeight: 600 }}>
                  {personName(r.profiles)}
                </Link>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {r.profiles?.email}
                </Typography>
              </>
            ),
          },
          { label: "План", render: (r) => r.membership_plans?.name ?? "—" },
          { label: "Плащане", render: (r) => providerLabel[r.provider], nowrap: true },
          {
            label: "Статус",
            render: (r) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                <StatusChip {...subscriptionStatus[r.status]} />
                {r.cancel_at_period_end && <Typography variant="caption">Спира в края на периода</Typography>}
              </Box>
            ),
          },
          { label: "Платен до", render: (r) => (r.current_period_end ? formatDate(r.current_period_end) : "—"), nowrap: true },
          {
            label: "",
            render: (r) =>
              r.provider === "bank_transfer" && (r.status === "active" || r.status === "pending_bank_transfer") ? (
                <ActionButton
                  label="Прекрати"
                  color="error"
                  confirm="Абонаментът ще бъде прекратен веднага и достъпът до Viber групите ще спре. Чакащите преводи по него остават в „Плащания“."
                  confirmLabel="Прекрати абонамента"
                  action={endBankTransferSubscription.bind(null, r.id)}
                  successMessage="Абонаментът е прекратен."
                />
              ) : null,
          },
        ]}
      />
    </>
  );
}
