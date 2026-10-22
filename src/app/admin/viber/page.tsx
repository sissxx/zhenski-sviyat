import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { setViberStatus } from "@/lib/admin/actions";
import { personName, viberStatus } from "@/lib/admin/labels";
import { adminRoutes, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/locale";

export const metadata: Metadata = { title: "Viber достъп" };

export default async function AdminViberPage() {
  const { supabase } = await requireAdminPage();
  const [{ data: actions }, { data: groups }] = await Promise.all([
    supabase.from("viber_access_actions").select("*").order("requested_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("viber_groups")
      .select("id, name, is_active, plan_viber_groups(membership_plans(name)), viber_group_invites(invite_link), viber_memberships(status)")
      .order("sort_order")
      .order("name"),
  ]);
  const userIds = [...new Set((actions ?? []).map((a) => a.user_id).filter((id): id is string => Boolean(id)))];
  const { data: people } = userIds.length
    ? await supabase.from("profiles").select("id, first_name, last_name, email, phone").in("id", userIds)
    : { data: [] };
  const personById = new Map((people ?? []).map((p) => [p.id, p]));
  const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));

  return (
    <>
      <AdminPageHeader
        title="Viber достъп"
        description="Viber не позволява автоматично добавяне и премахване, затова сайтът ти казва кого да поканиш и кого да махнеш. Направи го във Viber и отбележи тук."
      />

      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        Задачи ({actions?.length ?? 0})
      </Typography>
      <DataTable
        rows={actions ?? []}
        rowKey={(a) => `${a.action}-${a.user_id}-${a.viber_group_id}`}
        empty="Няма какво да се прави. Всички с активен абонамент са в групите си."
        columns={[
          {
            label: "Действие",
            render: (a) =>
              a.action === "invite" ? <StatusChip label="Покани" tone="info" /> : <StatusChip label="Премахни" tone="warning" />,
          },
          {
            label: "Член",
            render: (a) => {
              const person = a.user_id ? personById.get(a.user_id) : null;
              return (
                <>
                  {a.user_id ? (
                    <Link href={itemPath(adminRoutes.users, a.user_id)} sx={{ fontWeight: 600 }}>
                      {personName(person)}
                    </Link>
                  ) : (
                    "—"
                  )}
                  <Typography variant="caption" sx={{ display: "block" }}>
                    Viber: {a.viber_phone || person?.phone || "няма номер"}
                    {a.viber_display_name ? ` · ${a.viber_display_name}` : ""}
                  </Typography>
                </>
              );
            },
          },
          { label: "Група", render: (a) => (a.viber_group_id ? groupName.get(a.viber_group_id) : "—") },
          {
            label: "Сега",
            render: (a) => (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-start" }}>
                {a.status ? <StatusChip {...viberStatus[a.status]} /> : <StatusChip label="Не е поискала" />}
                {a.requested_at && <Typography variant="caption">поискано {formatDateTime(a.requested_at)}</Typography>}
              </Box>
            ),
          },
          {
            label: "Отбележи",
            render: (a) =>
              a.user_id && a.viber_group_id ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {a.action === "invite" ? (
                    <>
                      <ActionButton label="Поканих я" action={setViberStatus.bind(null, a.user_id, a.viber_group_id, "invited")} successMessage="Отбелязано." />
                      <ActionButton
                        label="В групата е"
                        variant="contained"
                        action={setViberStatus.bind(null, a.user_id, a.viber_group_id, "joined")}
                        successMessage="Отбелязано."
                      />
                    </>
                  ) : (
                    <ActionButton
                      label="Премахнах я"
                      color="warning"
                      action={setViberStatus.bind(null, a.user_id, a.viber_group_id, "removed")}
                      successMessage="Отбелязано."
                    />
                  )}
                </Box>
              ) : null,
          },
        ]}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 2 }}>
        <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
          Групи
        </Typography>
        <Link href={newPath(adminRoutes.viber)} sx={{ fontWeight: 600 }}>
          + Нова група
        </Link>
      </Box>
      <DataTable
        rows={groups ?? []}
        rowKey={(g) => g.id}
        empty="Още няма Viber групи."
        columns={[
          { label: "Група", render: (g) => <Link href={itemPath(adminRoutes.viber, g.id)}>{g.name}</Link> },
          { label: "Планове", render: (g) => g.plan_viber_groups.map((p) => p.membership_plans?.name).filter(Boolean).join(", ") || "—" },
          {
            label: "Линк за покана",
            render: (g) => (g.viber_group_invites?.invite_link ? "Има" : <StatusChip label="Няма" tone="warning" />),
          },
          { label: "В групата", render: (g) => g.viber_memberships.filter((m) => m.status === "joined").length, align: "right" },
          { label: "Статус", render: (g) => <StatusChip {...(g.is_active ? { label: "Активна", tone: "success" } : { label: "Неактивна" })} /> },
        ]}
      />
    </>
  );
}
