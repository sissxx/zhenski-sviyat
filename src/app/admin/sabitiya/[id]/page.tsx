import type { Metadata } from "next";
import Button from "@mui/material/Button";
import { EntityEditPage } from "@/components/admin/EntityPages";
import { eventParticipantsPath } from "@/lib/admin/routes";
import { requireAdminPage } from "@/lib/admin/session";
import { eventPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Събитие" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditEventPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdminPage();
  const { data: event } = await supabase.from("events").select("slug, status").eq("id", id).maybeSingle();
  // Events with any registration can't be deleted (the database keeps registrations); cancel them instead.
  const { count } = await supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", id);

  return (
    <EntityEditPage
      entity="event"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.title)}
      backLabel="Събития"
      deleteConfirm={count ? undefined : "Събитието ще бъде изтрито завинаги."}
      actions={
        <>
          <Button size="small" variant="contained" href={eventParticipantsPath(id)} sx={{ minWidth: 0 }}>
            Участнички ({count ?? 0})
          </Button>
          {event && event.status !== "draft" && (
            <Button size="small" variant="outlined" href={eventPath(event.slug)} target="_blank" sx={{ minWidth: 0 }}>
              Виж на сайта
            </Button>
          )}
        </>
      }
    />
  );
}
