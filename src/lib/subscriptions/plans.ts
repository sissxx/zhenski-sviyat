import { membershipPlans } from "@/content/plans";
import type { Json } from "@/lib/supabase/database.types";

/** Plan helpers shared by the public membership page and the account area. No database access here. */

/** One plan as the public "Членство" page shows it. */
export type PublicPlan = {
  /** Database id, or null for the built-in fallback shown before an admin has created plans. */
  id: string | null;
  slug: string;
  name: string;
  description: string | null;
  features: string[];
  priceCents: number;
  billingInterval: "month" | "year";
  /** The price is not final yet (only for the built-in fallback, whose prices come from src/content/plans.ts). */
  priceProvisional: boolean;
  allowBankTransfer: boolean;
  viberGroups: string[];
};

/** The `features` jsonb column: an array of strings, anything else dropped. */
export function planFeatures(features: Json | null | undefined): string[] {
  return Array.isArray(features) ? features.filter((f): f is string => typeof f === "string" && f.trim() !== "") : [];
}

export const perInterval = (interval: string) => (interval === "year" ? "година" : "месец");

/** The two plans from src/content/plans.ts, for when the database has no active plans yet. */
export function fallbackPlans(): PublicPlan[] {
  return Object.values(membershipPlans).map((plan) => ({
    id: null,
    slug: plan.slug,
    name: plan.title,
    description: plan.text,
    features: [...plan.benefits],
    priceCents: plan.priceCents,
    billingInterval: "month",
    priceProvisional: plan.priceProvisional,
    allowBankTransfer: true,
    viberGroups: [],
  }));
}

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  features: Json;
  price_cents: number;
  billing_interval: "month" | "year";
  allow_bank_transfer: boolean;
  plan_viber_groups: { viber_groups: { name: string; is_active: boolean } | null }[];
};

/** Database rows to public plans. Inactive or hidden Viber groups are left out. */
export function toPublicPlans(rows: PlanRow[]): PublicPlan[] {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    features: planFeatures(row.features),
    priceCents: row.price_cents,
    billingInterval: row.billing_interval,
    priceProvisional: false,
    allowBankTransfer: row.allow_bank_transfer,
    viberGroups: row.plan_viber_groups
      .map((link) => link.viber_groups)
      .filter((group): group is { name: string; is_active: boolean } => Boolean(group?.is_active))
      .map((group) => group.name),
  }));
}
