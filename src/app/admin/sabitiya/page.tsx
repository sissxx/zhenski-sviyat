import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { eventStatus } from "@/lib/admin/labels";
import { adminRoutes, eventParticipantsPath, itemPath, newPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Събития" };

type Props = { searchParams: Promise<{ minali?: string }> };

export default async function AdminEventsPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const past = Boolean((await searchParams).minali);
  const now = new Date().toISOString();
  const query = supabase
    .from("event_listing")
    .select("id, title, status, starts_at, price_cents, capacity, seats_taken, registration_open");
  const { data } = past
    ? await query.lt("starts_at", now).order("starts_at", { ascending: false }).limit(200)
    : await query.gte("starts_at", now).order("starts_at");

  return (
    <>
      <AdminPageHeader
        title="Събития"
        description="Създавай и редактирай събития, цени, места и срокове за записване. Черновите не се виждат на сайта."
        action={{ label: "Ново събитие", href: newPath(adminRoutes.events) }}
      />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button size="small" variant={past ? "text" : "contained"} href={adminRoutes.events} sx={{ minWidth: 0 }}>
          Предстоящи
        </Button>
        <Button size="small" variant={past ? "contained" : "text"} href={`${adminRoutes.events}?minali=1`} sx={{ minWidth: 0 }}>
          Минали
        </Button>
      </Box>
      <DataTable
        rows={data ?? []}
        rowKey={(r) => r.id ?? ""}
        empty={past ? "Няма минали събития." : "Няма предстоящи събития."}
        columns={[
          {
            label: "Събитие",
            render: (r) => (
              <>
                <Link href={itemPath(adminRoutes.events, r.id!)} sx={{ fontWeight: 600 }}>
                  {r.title}
                </Link>
                {r.status === "published" && (
                  <Typography variant="caption" sx={{ display: "block" }}>
                    {r.registration_open ? "Записването е отворено" : "Записването е затворено"}
                  </Typography>
                )}
              </>
            ),
          },
          { label: "Начало", render: (r) => formatDateTime(r.starts_at!), nowrap: true },
          { label: "Статус", render: (r) => <StatusChip {...eventStatus[r.status!]} /> },
          { label: "Цена", render: (r) => (r.price_cents ? formatPrice(r.price_cents) : "Безплатно"), nowrap: true },
          {
            label: "Записани",
            nowrap: true,
            render: (r) => (
              <Link href={eventParticipantsPath(r.id!)}>
                {r.seats_taken ?? 0}
                {r.capacity ? ` / ${r.capacity}` : ""}
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
