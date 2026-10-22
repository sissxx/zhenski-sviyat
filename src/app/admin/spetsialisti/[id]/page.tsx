import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ActionButton } from "@/components/admin/ActionButton";
import { EntityEditPage } from "@/components/admin/EntityPages";
import { AddAvailabilityForm, AddTimeOffForm, SpecialistServicesForm } from "@/components/admin/SpecialistPanels";
import { Panel } from "@/components/ui/Panel";
import { deleteAvailability, deleteTimeOff } from "@/lib/admin/actions";
import { centsToEuros } from "@/lib/admin/convert";
import { weekdayLabel } from "@/lib/admin/labels";
import { requireAdminPage } from "@/lib/admin/session";
import { formatDate, formatDateTime, formatPrice } from "@/lib/locale";

export const metadata: Metadata = { title: "Специалист" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

function PanelTitle({ title, description }: { title: string; description?: string }) {
  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ color: "primary.main" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

export default async function EditSpecialistPage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdminPage();
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  const [{ data: types }, { data: offered }, { data: hours }, { data: timeOff }, { count: bookings }] = valid
    ? await Promise.all([
        supabase.from("consultation_types").select("id, name, price_cents, is_active").order("sort_order").order("name"),
        supabase.from("specialist_consultation_types").select("consultation_type_id, price_cents_override").eq("specialist_id", id),
        supabase.from("specialist_availability").select("*").eq("specialist_id", id).order("weekday").order("start_time"),
        supabase
          .from("specialist_time_off")
          .select("*")
          .eq("specialist_id", id)
          .gte("ends_at", new Date().toISOString())
          .order("starts_at"),
        supabase.from("consultation_bookings").select("id", { count: "exact", head: true }).eq("specialist_id", id),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { count: 0 }];

  const offeredById = new Map((offered ?? []).map((o) => [o.consultation_type_id, o.price_cents_override]));
  const serviceOptions = (types ?? []).map((t) => ({
    id: t.id,
    name: t.is_active ? t.name : `${t.name} (скрита)`,
    price: formatPrice(t.price_cents),
    selected: offeredById.has(t.id),
    ownPrice: centsToEuros(offeredById.get(t.id) ?? null),
  }));

  return (
    <EntityEditPage
      entity="specialist"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.full_name)}
      backLabel="Специалисти"
      deleteConfirm={bookings ? undefined : "Специалистът и графикът му ще бъдат изтрити завинаги."}
    >
      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <PanelTitle title="Услуги" description="Кои консултации предлага. Празна собствена цена = цената на услугата." />
        <SpecialistServicesForm specialistId={id} options={serviceOptions} />
      </Panel>

      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <PanelTitle
          title="Работно време"
          description="Седмичните часове, в които може да се запазва час (българско време). От тях се махат отсъствията и вече запазените часове."
        />
        {hours?.length ? (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {hours.map((h) => (
              <Box
                component="li"
                key={h.id}
                sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Typography>
                  <strong>{weekdayLabel[h.weekday]}</strong> {h.start_time.slice(0, 5)}–{h.end_time.slice(0, 5)}
                  {(h.valid_from || h.valid_until) && (
                    <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
                      {" "}
                      · {h.valid_from ? `от ${formatDate(h.valid_from)}` : ""} {h.valid_until ? `до ${formatDate(h.valid_until)}` : ""}
                    </Typography>
                  )}
                </Typography>
                <ActionButton label="Премахни" color="error" action={deleteAvailability.bind(null, h.id)} successMessage="Премахнато." />
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>Още няма работно време, затова не се показват свободни часове.</Typography>
        )}
        <AddAvailabilityForm specialistId={id} />
      </Panel>

      <Panel sx={{ alignItems: "stretch", gap: 2 }}>
        <PanelTitle title="Отсъствия" description="Отпуск, болничен и други периоди без консултации. Вече запазените часове не се отменят сами." />
        {timeOff?.length ? (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {timeOff.map((t) => (
              <Box
                component="li"
                key={t.id}
                sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Typography>
                  {formatDateTime(t.starts_at)} – {formatDateTime(t.ends_at)}
                  {t.reason ? ` · ${t.reason}` : ""}
                </Typography>
                <ActionButton label="Премахни" color="error" action={deleteTimeOff.bind(null, t.id)} successMessage="Премахнато." />
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: "text.secondary" }}>Няма предстоящи отсъствия.</Typography>
        )}
        <AddTimeOffForm specialistId={id} />
      </Panel>
    </EntityEditPage>
  );
}
