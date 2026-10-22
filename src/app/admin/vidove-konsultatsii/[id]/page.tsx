import type { Metadata } from "next";
import { EntityEditPage } from "@/components/admin/EntityPages";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Вид консултация" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ zapazeno?: string }> };

export default async function EditConsultationTypePage({ params, searchParams }: Props) {
  const [{ id }, { zapazeno }] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdminPage();
  const { count } = await supabase.from("consultation_bookings").select("id", { count: "exact", head: true }).eq("consultation_type_id", id);
  return (
    <EntityEditPage
      entity="consultationType"
      id={id}
      saved={Boolean(zapazeno)}
      title={(v) => String(v.name)}
      backLabel="Видове консултации"
      deleteConfirm={count ? undefined : "Видът консултация ще бъде изтрит завинаги."}
    />
  );
}
