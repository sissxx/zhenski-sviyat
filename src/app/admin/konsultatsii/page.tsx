import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { cancelBooking, setBookingOutcome } from "@/lib/admin/actions";
import { bookingStatus, paymentStatus, personName, providerLabel } from "@/lib/admin/labels";
import { adminRoutes } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime, formatPrice, formatTime } from "@/lib/locale";

export const metadata: Metadata = { title: "Консултации" };

type Props = { searchParams: Promise<{ minali?: string; spetsialist?: string }> };

export default async function AdminBookingsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const { minali, spetsialist } = await searchParams;
  const past = Boolean(minali);
  const now = new Date().toISOString();

  let query = supabase
    .from("consultation_bookings")
    .select(
      "id, starts_at, ends_at, status, price_cents, payment_method, hold_expires_at, user_note, cancellation_reason, reschedule_count, profiles!consultation_bookings_user_id_fkey(first_name, last_name, email, phone), specialists(full_name), consultation_types(name), payments(status, bank_reference)",
    );
  if (spetsialist && /^[0-9a-f-]{36}$/i.test(spetsialist)) query = query.eq("specialist_id", spetsialist);
  const { data } = past
    ? await query.lt("starts_at", now).order("starts_at", { ascending: false }).limit(200)
    : await query.gte("starts_at", now).order("starts_at").limit(500);
  const { data: specialists } = await supabase.from("specialists").select("id, full_name").order("sort_order").order("full_name");

  const link = (params: Record<string, string | undefined>) => {
    const search = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
    return `${adminRoutes.bookings}${search.size ? `?${search}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Консултации"
        description="Запазените часове. Отказаните освобождават часа веднага; платените отиват в „Плащания → За преглед“."
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button size="small" variant={past ? "text" : "contained"} href={link({ spetsialist })} sx={{ minWidth: 0 }}>
          Предстоящи
        </Button>
        <Button size="small" variant={past ? "contained" : "text"} href={link({ minali: "1", spetsialist })} sx={{ minWidth: 0 }}>
          Минали
        </Button>
        <Box sx={{ width: 16 }} />
        <Button size="small" variant={spetsialist ? "text" : "outlined"} href={link({ minali })} sx={{ minWidth: 0 }}>
          Всички специалисти
        </Button>
        {(specialists ?? []).map((s) => (
          <Button
            key={s.id}
            size="small"
            variant={spetsialist === s.id ? "outlined" : "text"}
            href={link({ minali, spetsialist: s.id })}
            sx={{ minWidth: 0 }}
          >
            {s.full_name}
          </Button>
        ))}
      </Box>
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty={past ? "Няма минали консултации." : "Няма предстоящи консултации."}
        columns={[
          {
            label: "Час",
            nowrap: true,
            render: (r) => (
              <>
                {formatDateTime(r.starts_at)}
                <Typography variant="caption" sx={{ display: "block" }}>
                  до {formatTime(r.ends_at)}
                </Typography>
              </>
            ),
          },
          {
            label: "Клиент",
            render: (r) => (
              <>
                <Typography sx={{ fontWeight: 600 }}>{personName(r.profiles)}</Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {r.profiles?.email}
                  {r.profiles?.phone ? ` · ${r.profiles.phone}` : ""}
                </Typography>
                {r.user_note && (
                  <Typography variant="caption" sx={{ display: "block", fontStyle: "italic" }}>
                    „{r.user_note}“
                  </Typography>
                )}
              </>
            ),
          },
          {
            label: "Специалист и услуга",
            render: (r) => (
              <>
                {r.specialists?.full_name}
                <Typography variant="caption" sx={{ display: "block" }}>
                  {r.consultation_types?.name}
                </Typography>
              </>
            ),
          },
          {
            label: "Статус",
            render: (r) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                <StatusChip {...bookingStatus[r.status]} />
                {r.status === "cancelled" && r.cancellation_reason && <Typography variant="caption">{r.cancellation_reason}</Typography>}
                {r.reschedule_count > 0 && <Typography variant="caption">Местена {r.reschedule_count} пъти</Typography>}
              </Box>
            ),
          },
          {
            label: "Плащане",
            render: (r) => {
              const payment = r.payments?.[0];
              if (!r.price_cents) return "Безплатна";
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                  <span>
                    {formatPrice(r.price_cents)}
                    {r.payment_method ? ` · ${providerLabel[r.payment_method]}` : " · на място"}
                  </span>
                  {payment && <StatusChip {...paymentStatus[payment.status]} />}
                </Box>
              );
            },
          },
          {
            label: "Действия",
            render: (r) => (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {(r.status === "confirmed" || r.status === "pending_payment") && r.starts_at > now && (
                  <ActionButton
                    label="Откажи"
                    color="error"
                    confirm="Консултацията ще бъде отказана и часът освободен."
                    input={{ label: "Причина (вижда я клиентът)" }}
                    confirmLabel="Откажи консултацията"
                    action={cancelBooking.bind(null, r.id)}
                    successMessage="Консултацията е отказана."
                  />
                )}
                {["confirmed", "completed", "no_show"].includes(r.status) && r.starts_at <= now && (
                  <>
                    {r.status !== "completed" && (
                      <ActionButton label="Проведена" action={setBookingOutcome.bind(null, r.id, "completed")} successMessage="Отбелязано." />
                    )}
                    {r.status !== "no_show" && (
                      <ActionButton
                        label="Не дойде"
                        color="warning"
                        action={setBookingOutcome.bind(null, r.id, "no_show")}
                        successMessage="Отбелязано."
                      />
                    )}
                  </>
                )}
              </Box>
            ),
          },
        ]}
      />
    </>
  );
}
