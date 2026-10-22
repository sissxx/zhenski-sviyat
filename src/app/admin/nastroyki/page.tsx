import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EntityForm } from "@/components/admin/EntityForm";
import { FormAlert } from "@/components/forms/FormAlert";
import { requireAdminPage } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Настройки" };

const numberFields = [
  "consultation_max_advance_days",
  "consultation_min_notice_hours",
  "consultation_cancel_deadline_hours",
  "consultation_max_reschedules",
  "consultation_slot_step_minutes",
  "event_cancel_deadline_hours",
  "checkout_hold_minutes",
  "bank_transfer_hold_days",
  "subscription_renewal_window_days",
  "subscription_past_due_grace_days",
] as const;

const textFields = ["bank_transfer_beneficiary", "bank_transfer_iban", "bank_transfer_bic", "bank_transfer_bank_name"] as const;

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdminPage();
  const { data: settings } = await supabase.from("app_settings").select("*").eq("id", true).maybeSingle();
  if (!settings) {
    return <FormAlert severity="error">Настройките не могат да бъдат заредени.</FormAlert>;
  }
  const values = {
    ...Object.fromEntries(numberFields.map((key) => [key, String(settings[key])])),
    ...Object.fromEntries(textFields.map((key) => [key, settings[key] ?? ""])),
    subscriptions_allow_bank_transfer: settings.subscriptions_allow_bank_transfer,
  };

  return (
    <>
      <AdminPageHeader
        title="Настройки"
        description="Правилата за записване, отказ и плащане. Промените важат веднага за новите записвания; вече направените не се променят."
      />
      <EntityForm entity="settings" id={null} defaultValues={values} submitLabel="Запази настройките" />
    </>
  );
}
