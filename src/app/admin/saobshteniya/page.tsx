import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusChip } from "@/components/admin/StatusChip";
import { setMessageHandled } from "@/lib/admin/actions";
import { adminRoutes } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/locale";

export const metadata: Metadata = { title: "Съобщения" };

const tabs = [
  { key: "novi", label: "Нови" },
  { key: "vsichki", label: "Всички" },
] as const;

type Props = { searchParams: Promise<{ filtar?: string }> };

/** Messages from the contact form (/kontakti), newest first. */
export default async function AdminMessagesPage({ searchParams }: Props) {
  const { supabase } = await requireAdminPage();
  const { filtar } = await searchParams;
  const tab = tabs.find((t) => t.key === filtar) ?? tabs[0];

  let query = supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, handled_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (tab.key === "novi") query = query.is("handled_at", null);
  const { data } = await query;

  return (
    <>
      <AdminPageHeader
        title="Съобщения"
        description="Запитванията от формата за контакт. Всяко съобщение идва и на имейла ти; отговори на подателя по имейл и после го отбележи като отговорено."
      />
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <Button
            key={t.key}
            size="small"
            variant={t === tab ? "contained" : "text"}
            href={`${adminRoutes.messages}?filtar=${t.key}`}
            sx={{ minWidth: 0 }}
          >
            {t.label}
          </Button>
        ))}
      </Box>
      <DataTable
        rows={data ?? []}
        rowKey={(m) => m.id}
        empty={tab.key === "novi" ? "Няма нови съобщения." : "Още няма съобщения."}
        columns={[
          {
            label: "От",
            render: (m) => (
              <>
                <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
                <Link href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? ""}`)}`} sx={{ overflowWrap: "anywhere" }}>
                  {m.email}
                </Link>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {formatDateTime(m.created_at)}
                </Typography>
              </>
            ),
          },
          {
            label: "Съобщение",
            render: (m) => (
              <>
                {m.subject && <Typography sx={{ fontWeight: 600 }}>{m.subject}</Typography>}
                <Typography variant="body2" sx={{ whiteSpace: "pre-line", overflowWrap: "anywhere" }}>
                  {m.message}
                </Typography>
              </>
            ),
          },
          {
            label: "Статус",
            render: (m) =>
              m.handled_at ? <StatusChip label="Отговорено" tone="success" /> : <StatusChip label="Ново" tone="warning" />,
          },
          {
            label: "Действия",
            render: (m) =>
              m.handled_at ? (
                <ActionButton label="Върни като ново" variant="text" action={setMessageHandled.bind(null, m.id, false)} successMessage="Отбелязано като ново." />
              ) : (
                <ActionButton label="Отговорено" action={setMessageHandled.bind(null, m.id, true)} successMessage="Отбелязано като отговорено." />
              ),
          },
        ]}
      />
    </>
  );
}
