import { db } from "./support";

/** Bank details for the transfer instructions, as an admin would enter them in Настройки. */
export default async function globalSetup() {
  const { error } = await db
    .from("app_settings")
    .update({
      bank_transfer_beneficiary: "Сдружение Женски свят",
      bank_transfer_iban: "BG80BNBG96611020345678",
      bank_transfer_bic: "BNBGBGSD",
      bank_transfer_bank_name: "Тестова банка",
    })
    .eq("id", true);
  if (error) {
    throw new Error(`Local Supabase is not reachable or not migrated (${error.message}). Run \`npx supabase start\` first.`);
  }
}
