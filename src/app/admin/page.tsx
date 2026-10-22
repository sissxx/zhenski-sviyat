import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Panel } from "@/components/ui/Panel";
import { runMaintenance } from "@/lib/admin/actions";
import { personName } from "@/lib/admin/labels";
import { adminRoutes, eventParticipantsPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime, formatTime } from "@/lib/locale";

export const metadata: Metadata = { title: "Табло" };

export default async function AdminHomePage() {
  const { supabase } = await requireAdminPage();
  const now = new Date();
  const inAWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const count = { count: "exact", head: true } as const;

  const [transfers, review, viber, activeSubs, { data: events }, { data: bookings }] = await Promise.all([
    supabase.from("payments").select("id", count).eq("provider", "bank_transfer").eq("status", "pending"),
    supabase.from("payments").select("id", count).eq("needs_review", true),
    supabase.from("viber_access_actions").select("user_id", count),
    supabase.from("subscriptions").select("id", count).in("status", ["active", "trialing", "past_due"]),
    supabase
      .from("event_listing")
      .select("id, title, starts_at, capacity, seats_taken, status")
      .gte("starts_at", now.toISOString())
      .neq("status", "draft")
      .order("starts_at")
      .limit(5),
    supabase
      .from("consultation_bookings")
      .select("id, starts_at, ends_at, profiles!consultation_bookings_user_id_fkey(first_name, last_name, email), specialists(full_name), consultation_types(name)")
      .eq("status", "confirmed")
      .gte("starts_at", now.toISOString())
      .lt("starts_at", inAWeek)
      .order("starts_at"),
  ]);

  const tiles = [
    { label: "Чакащи преводи", value: transfers.count ?? 0, href: `${adminRoutes.payments}?filtar=prevodi`, urgent: true },
    { label: "Плащания за преглед", value: review.count ?? 0, href: `${adminRoutes.payments}?filtar=pregled`, urgent: true },
    { label: "Viber задачи", value: viber.count ?? 0, href: adminRoutes.viber, urgent: true },
    { label: "Активни абонаменти", value: activeSubs.count ?? 0, href: adminRoutes.subscriptions, urgent: false },
  ];

  return (
    <>
      <AdminPageHeader title="Табло" description="Какво чака действие от теб и какво предстои тази седмица." />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
        {tiles.map((tile) => (
          <Panel key={tile.label} tone={tile.urgent && tile.value > 0 ? "mint" : "paper"} sx={{ gap: 0.5, p: { xs: 2, md: 2.5 } }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {tile.label}
            </Typography>
            <Typography variant="h3" component="p" sx={{ color: "primary.main" }}>
              {tile.value}
            </Typography>
            <Button href={tile.href} size="small" sx={{ minWidth: 0, px: 0, minHeight: 28 }}>
              Отвори →
            </Button>
          </Panel>
        ))}
      </Box>

      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        Предстоящи събития
      </Typography>
      <DataTable
        rows={events ?? []}
        rowKey={(r) => r.id!}
        empty="Няма публикувани предстоящи събития."
        columns={[
          { label: "Събитие", render: (r) => r.title },
          { label: "Начало", render: (r) => formatDateTime(r.starts_at!), nowrap: true },
          {
            label: "Записани",
            nowrap: true,
            render: (r) => (
              <Button href={eventParticipantsPath(r.id!)} size="small" sx={{ minWidth: 0, minHeight: 28, px: 1 }}>
                {r.seats_taken ?? 0}
                {r.capacity ? ` / ${r.capacity}` : ""}
              </Button>
            ),
          },
        ]}
      />

      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        Консултации през следващите 7 дни
      </Typography>
      <DataTable
        rows={bookings ?? []}
        rowKey={(r) => r.id}
        empty="Няма потвърдени консултации през следващите 7 дни."
        columns={[
          { label: "Час", render: (r) => `${formatDateTime(r.starts_at)}–${formatTime(r.ends_at)}`, nowrap: true },
          { label: "Клиент", render: (r) => personName(r.profiles) },
          { label: "Специалист", render: (r) => r.specialists?.full_name },
          { label: "Услуга", render: (r) => r.consultation_types?.name },
        ]}
      />

      <Panel sx={{ gap: 1 }}>
        <Typography variant="h6" component="h2" sx={{ color: "primary.main" }}>
          Обновяване на статусите
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Освобождава неплатените задържани места, изтичащите абонаменти по банков път и отбелязва минали събития и консултации като
          приключили. Става и автоматично, щом бъде включена планираната задача.
        </Typography>
        <ActionButton label="Обнови сега" action={runMaintenance} successMessage="Статусите са обновени." />
      </Panel>
    </>
  );
}
