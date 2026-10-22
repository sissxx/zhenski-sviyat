import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { Panel } from "@/components/ui/Panel";
import { setAccountStatus, setRole } from "@/lib/admin/actions";
import {
  accountStatus,
  bookingStatus,
  paymentStatus,
  providerLabel,
  registrationStatus,
  roleLabel,
  subscriptionStatus,
  viberStatus,
} from "@/lib/admin/labels";
import { adminRoutes, eventParticipantsPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDate, formatDateTime, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Потребител" };

type Props = { params: Promise<{ id: string }> };

function Heading({ children }: { children: string }) {
  return (
    <Typography variant="h5" component="h2" sx={{ color: "primary.main", mt: 1 }}>
      {children}
    </Typography>
  );
}

export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;
  const { supabase, user: admin } = await requireAdminPage();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: profile }, { data: roles }, { data: registrations }, { data: bookings }, { data: subscriptions }, { data: payments }, { data: viber }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("user_roles").select("role, granted_at").eq("user_id", id),
      supabase
        .from("event_registrations")
        .select("id, event_id, status, price_cents, created_at, events(title, starts_at)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("consultation_bookings")
        .select("id, starts_at, status, price_cents, specialists(full_name), consultation_types(name)")
        .eq("user_id", id)
        .order("starts_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id, status, provider, current_period_end, membership_plans(name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, provider, status, amount_cents, bank_reference, description, created_at, needs_review")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("viber_memberships").select("id, status, viber_phone, updated_at, viber_groups(name)").eq("user_id", id),
    ]);
  if (!profile) notFound();

  const hasRole = (role: "admin" | "specialist") => (roles ?? []).some((r) => r.role === role);
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  const isSelf = admin.id === id;

  return (
    <>
      <AdminPageHeader title={name} back={{ label: "Потребители", href: adminRoutes.users }} />

      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
          {[
            ["Имейл", profile.email],
            ["Телефон", profile.phone ?? "—"],
            ["Регистрация", formatDate(profile.created_at)],
            ["Новини по имейл", profile.marketing_consent ? "Да" : "Не"],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
              </Typography>
              <Typography sx={{ wordBreak: "break-word" }}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <StatusChip {...accountStatus[profile.status]} />
          {(roles ?? []).map((r) => (
            <StatusChip key={r.role} label={roleLabel[r.role]} tone="info" />
          ))}
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {profile.status === "active" ? (
            !isSelf && (
              <ActionButton
                label="Спри профила"
                color="error"
                confirm="Потребителят няма да може да се записва за събития и консултации, а ролите му спират да действат, докато не активираш профила отново. Записванията му остават."
                confirmLabel="Спри"
                action={setAccountStatus.bind(null, id, "suspended")}
                successMessage="Профилът е спрян."
              />
            )
          ) : (
            <ActionButton label="Активирай профила" variant="contained" action={setAccountStatus.bind(null, id, "active")} successMessage="Профилът е активен." />
          )}
          {hasRole("admin") ? (
            <ActionButton
              label="Махни администратор"
              color="warning"
              confirm={isSelf ? "Ще загубиш достъп до администрацията веднага." : "Потребителят ще загуби достъп до администрацията."}
              confirmLabel="Махни"
              action={setRole.bind(null, id, "admin", false)}
              successMessage="Ролята е махната."
              redirectTo={isSelf ? "/" : undefined}
            />
          ) : (
            <ActionButton
              label="Направи администратор"
              confirm="Администраторите виждат личните данни и плащанията на всички и могат да променят всичко в сайта."
              confirmLabel="Дай достъп"
              action={setRole.bind(null, id, "admin", true)}
              successMessage="Потребителят е администратор."
            />
          )}
          {hasRole("specialist") && (
            <ActionButton
              label="Махни роля специалист"
              color="warning"
              confirm="Потребителят няма да вижда графика и клиентите си. Свържи или откачи профила от страницата на специалиста."
              confirmLabel="Махни"
              action={setRole.bind(null, id, "specialist", false)}
              successMessage="Ролята е махната."
            />
          )}
        </Box>
      </Panel>

      <Heading>Събития</Heading>
      <DataTable
        rows={registrations ?? []}
        rowKey={(r) => r.id}
        empty="Няма записвания."
        columns={[
          { label: "Събитие", render: (r) => <Link href={eventParticipantsPath(r.event_id)}>{r.events?.title}</Link> },
          { label: "Дата", render: (r) => (r.events ? formatDateTime(r.events.starts_at) : "—"), nowrap: true },
          { label: "Цена", render: (r) => (r.price_cents ? formatPrice(r.price_cents) : "Безплатно"), nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...registrationStatus[r.status]} /> },
        ]}
      />

      <Heading>Консултации</Heading>
      <DataTable
        rows={bookings ?? []}
        rowKey={(r) => r.id}
        empty="Няма консултации."
        columns={[
          { label: "Час", render: (r) => formatDateTime(r.starts_at), nowrap: true },
          { label: "Услуга", render: (r) => `${r.consultation_types?.name ?? ""} · ${r.specialists?.full_name ?? ""}` },
          { label: "Цена", render: (r) => (r.price_cents ? formatPrice(r.price_cents) : "Безплатна"), nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...bookingStatus[r.status]} /> },
        ]}
      />

      <Heading>Абонаменти</Heading>
      <DataTable
        rows={subscriptions ?? []}
        rowKey={(r) => r.id}
        empty="Няма абонаменти."
        columns={[
          { label: "План", render: (r) => r.membership_plans?.name ?? "—" },
          { label: "Плащане", render: (r) => providerLabel[r.provider] },
          { label: "Платен до", render: (r) => (r.current_period_end ? formatDate(r.current_period_end) : "—"), nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...subscriptionStatus[r.status]} /> },
        ]}
      />

      <Heading>Плащания</Heading>
      <DataTable
        rows={payments ?? []}
        rowKey={(r) => r.id}
        empty="Няма плащания."
        columns={[
          { label: "Дата", render: (r) => formatDateTime(r.created_at), nowrap: true },
          { label: "За", render: (r) => r.description ?? "—" },
          { label: "Сума", render: (r) => formatPrice(r.amount_cents), nowrap: true },
          { label: "Начин", render: (r) => (r.provider === "bank_transfer" ? `${providerLabel[r.provider]} · ${r.bank_reference}` : providerLabel[r.provider]) },
          {
            label: "Статус",
            render: (r) => (
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                <StatusChip {...paymentStatus[r.status]} />
                {r.needs_review && <StatusChip label="За преглед" tone="warning" />}
              </Box>
            ),
          },
        ]}
      />

      <Heading>Viber групи</Heading>
      <DataTable
        rows={viber ?? []}
        rowKey={(r) => r.id}
        empty="Не е заявявала достъп до Viber група."
        columns={[
          { label: "Група", render: (r) => r.viber_groups?.name ?? "—" },
          { label: "Номер", render: (r) => r.viber_phone ?? "—", nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...viberStatus[r.status]} /> },
          { label: "Обновено", render: (r) => formatDateTime(r.updated_at), nowrap: true },
        ]}
      />
    </>
  );
}
