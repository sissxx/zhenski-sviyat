import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { accountStatus, roleLabel } from "@/lib/admin/labels";
import { adminRoutes, itemPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDate } from "@/lib/locale";

export const metadata: Metadata = { title: "Потребители" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  let query = supabase
    .from("profiles")
    .select("id, email, first_name, last_name, phone, status, created_at, user_roles!user_roles_user_id_fkey(role)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    // Commas and brackets would break the filter syntax, so search with letters, digits, @ . + - and spaces only.
    const term = q.replace(/[^\p{L}\p{N}@.+\- ]/gu, "");
    query = query.or(`email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data } = await query;

  return (
    <>
      <AdminPageHeader title="Потребители" description="Профилите в сайта. Отвори профил, за да видиш записванията, плащанията и абонаментите му, да го спреш или да дадеш роля." />
      <Box component="form" action={adminRoutes.users} sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          name="q"
          defaultValue={q}
          placeholder="Име, имейл или телефон"
          size="small"
          sx={{ flex: "1 1 260px", maxWidth: 420 }}
          slotProps={{ htmlInput: { "aria-label": "Търсене" } }}
        />
        <Button type="submit" variant="contained" sx={{ minWidth: 0 }}>
          Търси
        </Button>
      </Box>
      {!q && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Последните 100 регистрирани.
        </Typography>
      )}
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id}
        empty={q ? "Няма намерени профили." : "Още няма регистрирани потребители."}
        columns={[
          {
            label: "Име",
            render: (r) => (
              <>
                <Link href={itemPath(adminRoutes.users, r.id)} sx={{ fontWeight: 600 }}>
                  {[r.first_name, r.last_name].filter(Boolean).join(" ") || "Без име"}
                </Link>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {r.email}
                </Typography>
              </>
            ),
          },
          { label: "Телефон", render: (r) => r.phone ?? "—", nowrap: true },
          { label: "Роли", render: (r) => r.user_roles.map((x) => roleLabel[x.role]).join(", ") || "—" },
          { label: "Статус", render: (r) => <StatusChip {...accountStatus[r.status]} /> },
          { label: "Регистрация", render: (r) => formatDate(r.created_at), nowrap: true },
        ]}
      />
    </>
  );
}
