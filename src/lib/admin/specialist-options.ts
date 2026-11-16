import "server-only";
import { requireAdminPage } from "./session";

/** The specialists as select options for the team form ("Същият човек е и специалист"), with "none" first. */
export async function specialistOptions() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("specialists").select("id, full_name, is_active").order("full_name");
  return {
    specialist_id: [
      { value: "", label: "— Не е специалист —" },
      ...(data ?? []).map((s) => ({ value: s.id, label: s.is_active ? s.full_name : `${s.full_name} (скрит)` })),
    ],
  };
}
