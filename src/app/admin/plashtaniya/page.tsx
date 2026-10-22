import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { confirmBankTransfer, recordRefund, rejectBankTransfer, resolvePaymentReview } from "@/lib/admin/actions";
import { centsToEuros } from "@/lib/admin/convert";
import { paymentStatus, personName, providerLabel } from "@/lib/admin/labels";
import { adminRoutes, eventParticipantsPath, itemPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Плащания" };

const tabs = [
  { key: "prevodi", label: "Чакащи преводи" },
  { key: "pregled", label: "За преглед" },
  { key: "vsichki", label: "Всички" },
] as const;

type Props = { searchParams: Promise<{ filtar?: string }> };

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const { filtar } = await searchParams;
  const tab = tabs.find((t) => t.key === filtar) ?? tabs[0];

  let query = supabase
    .from("payments")
    .select(
      "id, user_id, provider, status, amount_cents, refunded_amount_cents, description, bank_reference, expires_at, paid_at, created_at, needs_review, review_reason, admin_note, failure_reason, profiles!payments_user_id_fkey(first_name, last_name, email), event_registrations(event_id, events(title)), consultation_bookings(starts_at, consultation_types(name)), subscriptions(membership_plans(name))",
    );
  if (tab.key === "prevodi") query = query.eq("provider", "bank_transfer").eq("status", "pending").order("created_at");
  else if (tab.key === "pregled") query = query.eq("needs_review", true).order("created_at");
  else query = query.order("created_at", { ascending: false }).limit(200);
  const [{ data }, { data: settings }] = await Promise.all([
    query,
    supabase.from("app_settings").select("bank_transfer_iban").eq("id", true).maybeSingle(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Плащания"
        description="Потвърждавай банковите преводи, след като ги видиш в банковата сметка: търси основанието (напр. NSJS-7K3Q9P2A) в описанието на превода. Плащанията с карта се потвърждават сами от Stripe."
      />
      {!settings?.bank_transfer_iban && (
        <Typography variant="body2" sx={{ color: "warning.dark" }}>
          IBAN за преводи още не е въведен. Добави го в <Link href={adminRoutes.settings}>Настройки</Link>, за да го виждат платците.
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="small"
            variant={t === tab ? "contained" : "text"}
            href={`${adminRoutes.payments}?filtar=${t.key}`}
            sx={{ minWidth: 0 }}
          >
            {t.label}
          </Button>
        ))}
      </Box>
      <DataTable
        rows={data ?? []}
        rowKey={(p) => p.id}
        empty={tab.key === "prevodi" ? "Няма чакащи преводи." : tab.key === "pregled" ? "Няма плащания за преглед." : "Още няма плащания."}
        columns={[
          {
            label: "Основание",
            nowrap: true,
            render: (p) => (
              <>
                <Typography sx={{ fontWeight: 600, fontFamily: "monospace" }}>{p.provider === "bank_transfer" ? p.bank_reference : "—"}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {formatDateTime(p.created_at)}
                </Typography>
              </>
            ),
          },
          {
            label: "Платец",
            render: (p) => (
              <>
                {p.user_id ? (
                  <Link href={itemPath(adminRoutes.users, p.user_id)} sx={{ fontWeight: 600 }}>
                    {personName(p.profiles)}
                  </Link>
                ) : (
                  "Изтрит профил"
                )}
                <Typography variant="caption" sx={{ display: "block" }}>
                  {p.profiles?.email}
                </Typography>
              </>
            ),
          },
          {
            label: "За",
            render: (p) => {
              const event = p.event_registrations;
              const booking = p.consultation_bookings;
              const plan = p.subscriptions?.membership_plans?.name;
              return (
                <>
                  {event?.events ? (
                    <Link href={eventParticipantsPath(event.event_id)}>Събитие: {event.events.title}</Link>
                  ) : booking ? (
                    `Консултация: ${booking.consultation_types?.name ?? ""}, ${formatDateTime(booking.starts_at)}`
                  ) : plan ? (
                    `Абонамент: ${plan}`
                  ) : (
                    (p.description ?? "—")
                  )}
                  {p.needs_review && p.review_reason && (
                    <Typography variant="caption" sx={{ display: "block", color: "warning.dark" }}>
                      За преглед: {p.review_reason}
                    </Typography>
                  )}
                  {p.admin_note && (
                    <Typography variant="caption" sx={{ display: "block" }}>
                      Бележка: {p.admin_note}
                    </Typography>
                  )}
                </>
              );
            },
          },
          {
            label: "Сума",
            nowrap: true,
            render: (p) => (
              <>
                <Typography sx={{ fontWeight: 600 }}>{formatPrice(p.amount_cents)}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {providerLabel[p.provider]}
                </Typography>
                {p.refunded_amount_cents > 0 && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    върнати {formatPrice(p.refunded_amount_cents)}
                  </Typography>
                )}
              </>
            ),
          },
          {
            label: "Статус",
            render: (p) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                <StatusChip {...paymentStatus[p.status]} />
                {p.needs_review && <StatusChip label="За преглед" tone="warning" />}
                {p.status === "pending" && p.expires_at && <Typography variant="caption">изтича {formatDateTime(p.expires_at)}</Typography>}
                {p.failure_reason && <Typography variant="caption">{p.failure_reason}</Typography>}
              </Box>
            ),
          },
          {
            label: "Действия",
            render: (p) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {p.provider === "bank_transfer" && ["pending", "expired", "cancelled", "failed"].includes(p.status) && (
                  <ActionButton
                    label="Потвърди превода"
                    variant="contained"
                    confirm={`Потвърждаваш, че ${formatPrice(p.amount_cents)} с основание ${p.bank_reference} са получени по сметката.${
                      p.status === "pending" ? "" : " Преводът е пристигнал след срока: ако мястото вече е заето, плащането ще отиде „За преглед“."
                    }`}
                    input={{ label: "Бележка (по избор)" }}
                    confirmLabel="Потвърди"
                    action={confirmBankTransfer.bind(null, p.id)}
                    successMessage="Преводът е потвърден."
                  />
                )}
                {p.provider === "bank_transfer" && p.status === "pending" && (
                  <ActionButton
                    label="Отхвърли"
                    color="error"
                    confirm="Преводът ще се отбележи като неполучен и запазеното място или час ще се освободи."
                    input={{ label: "Причина" }}
                    confirmLabel="Отхвърли"
                    action={rejectBankTransfer.bind(null, p.id)}
                    successMessage="Преводът е отхвърлен."
                  />
                )}
                {["succeeded", "partially_refunded"].includes(p.status) && (
                  <ActionButton
                    label="Отбележи възстановяване"
                    color="warning"
                    confirm={
                      p.provider === "stripe"
                        ? "Първо върни парите от Stripe Dashboard, после запиши общата върната сума тук."
                        : "Първо върни парите по банков път, после запиши общата върната сума тук."
                    }
                    input={{ label: "Обща върната сума (€)", required: true, defaultValue: centsToEuros(p.amount_cents), inputMode: "decimal" }}
                    confirmLabel="Запиши"
                    action={recordRefund.bind(null, p.id)}
                    successMessage="Възстановяването е записано."
                  />
                )}
                {p.needs_review && (
                  <ActionButton
                    label="Затвори без връщане"
                    confirm="Плащането ще излезе от „За преглед“, без да се записва възстановяване."
                    input={{ label: "Какво реши (задължително)", required: true }}
                    confirmLabel="Затвори"
                    action={resolvePaymentReview.bind(null, p.id)}
                    successMessage="Прегледът е затворен."
                  />
                )}
              </Box>
            ),
          },
        ]}
      />
    </>
  );
}
