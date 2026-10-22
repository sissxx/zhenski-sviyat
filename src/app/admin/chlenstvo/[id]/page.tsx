import type { Metadata } from "next";
import Typography from "@mui/material/Typography";
import { EntityEditPage } from "@/components/admin/EntityPages";
import { PlanGroupsForm } from "@/components/admin/PlanGroupsForm";
import { Panel } from "@/components/ui/Panel";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "План" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditPlanPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdminPage();
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  const [{ data: groups }, { data: links }, { count: subscriptions }] = valid
    ? await Promise.all([
        supabase.from("viber_groups").select("id, name, is_active").order("sort_order").order("name"),
        supabase.from("plan_viber_groups").select("viber_group_id").eq("plan_id", id),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan_id", id),
      ])
    : [{ data: [] }, { data: [] }, { count: 0 }];

  return (
    <EntityEditPage
      entity="plan"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.name)}
      backLabel="Членство и планове"
      deleteConfirm={subscriptions ? undefined : "Планът ще бъде изтрит завинаги."}
    >
      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <div>
          <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
            Viber групи
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Членовете с активен абонамент за този план имат право на достъп до избраните групи.
          </Typography>
        </div>
        <PlanGroupsForm
          planId={id}
          groups={(groups ?? []).map((g) => ({ id: g.id, name: g.name, active: g.is_active }))}
          selected={(links ?? []).map((l) => l.viber_group_id)}
        />
      </Panel>
    </EntityEditPage>
  );
}
