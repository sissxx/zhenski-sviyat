import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { Panel } from "@/components/ui/Panel";
import { cancelRegistration, setCheckedIn } from "@/lib/admin/actions";
import { paymentStatus, personName, providerLabel, registrationStatus } from "@/lib/admin/labels";
import { eventParticipants } from "@/lib/admin/queries";
import { adminRoutes, itemPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Участнички" };

type Props = { params: Promise<{ id: string }> };

export default async function EventParticipantsPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdminPage();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: event } = await supabase.from("event_listing").select("id, title, starts_at, capacity, seats_taken").eq("id", id).maybeSingle();
  if (!event) notFound();
  const rows = await eventParticipants(supabase, id);
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const pending = rows.filter((r) => r.status === "pending_payment").length;
  const checkedIn = rows.filter((r) => r.status === "confirmed" && r.checked_in_at).length;

  return (
    <>
      <AdminPageHeader
        title={`Участнички: ${event.title}`}
        description={formatDateTime(event.starts_at!)}
        back={{ label: "Към събитието", href: itemPath(adminRoutes.events, id) }}
      >
        <Button variant="outlined" href={`${itemPath(adminRoutes.events, id)}/uchastnichki/csv`} sx={{ minWidth: 0 }}>
          Изтегли CSV
        </Button>
      </AdminPageHeader>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {[
          ["Потвърдени", confirmed],
          ["Чакат плащане", pending],
          ["Свободни места", event.capacity ? Math.max(event.capacity - (event.seats_taken ?? 0), 0) : "без лимит"],
          ["Дошли", checkedIn],
        ].map(([label, value]) => (
          <Panel key={label} sx={{ gap: 0.5, p: { xs: 2, md: 2.5 } }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {label}
            </Typography>
            <Typography variant="h4" component="p" sx={{ color: "primary.main" }}>
              {value}
            </Typography>
          </Panel>
        ))}
      </Box>
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="Още никой не се е записал."
        caption="Участнички"
        columns={[
          {
            label: "Име",
            render: (r) => (
              <>
                <Typography sx={{ fontWeight: 600 }}>{personName(r.profiles)}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {r.profiles?.email}
                  {r.profiles?.phone ? ` · ${r.profiles.phone}` : ""}
                </Typography>
              </>
            ),
          },
          {
            label: "Статус",
            render: (r) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                <StatusChip {...registrationStatus[r.status]} />
                {r.status === "pending_payment" && r.hold_expires_at && (
                  <Typography variant="caption">до {formatDateTime(r.hold_expires_at)}</Typography>
                )}
                {r.status === "cancelled" && r.cancellation_reason && <Typography variant="caption">{r.cancellation_reason}</Typography>}
              </Box>
            ),
          },
          {
            label: "Плащане",
            render: (r) => {
              const payment = r.payments?.[0];
              if (!r.price_cents) return "Безплатно";
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                  <span>
                    {formatPrice(r.price_cents)}
                    {r.payment_method ? ` · ${providerLabel[r.payment_method]}` : ""}
                  </span>
                  {payment && <StatusChip {...paymentStatus[payment.status]} />}
                  {payment?.bank_reference && r.payment_method === "bank_transfer" && (
                    <Typography variant="caption">{payment.bank_reference}</Typography>
                  )}
                </Box>
              );
            },
          },
          { label: "Записана", render: (r) => formatDateTime(r.created_at), nowrap: true },
          {
            label: "Действия",
            render: (r) =>
              r.status === "confirmed" || r.status === "pending_payment" ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {r.status === "confirmed" && (
                    <ActionButton
                      label={r.checked_in_at ? "Дошла ✓" : "Отбележи, че дойде"}
                      variant={r.checked_in_at ? "contained" : "outlined"}
                      action={setCheckedIn.bind(null, r.id, !r.checked_in_at)}
                      successMessage={r.checked_in_at ? "Отметката е махната." : "Отбелязано."}
                    />
                  )}
                  <ActionButton
                    label="Откажи"
                    color="error"
                    confirm={
                      r.price_cents && r.status === "confirmed"
                        ? "Записването ще бъде отказано и мястото освободено. Платената сума ще се появи в „Плащания → За преглед“, за да решиш за възстановяване."
                        : "Записването ще бъде отказано и мястото освободено."
                    }
                    input={{ label: "Причина (вижда я участничката)" }}
                    confirmLabel="Откажи записването"
                    action={cancelRegistration.bind(null, r.id)}
                    successMessage="Записването е отказано."
                  />
                </Box>
              ) : null,
          },
        ]}
      />
    </>
  );
}
