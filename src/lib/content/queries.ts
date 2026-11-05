import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { mediaUrl } from "@/lib/supabase/media";
import { faqs as draftFaqs } from "@/content/faq";
import { servicePackages } from "@/content/packages";

/**
 * Content the admin edits under „Съдържание“ (questions, partners, promotions), read for the public pages.
 * RLS shows visitors only published rows (and hides promotions after their end date). Each list falls back
 * to the draft content from src/content while the admin has published nothing, so a page is never empty.
 */

async function client() {
  // Admins change these at any time, so the pages render per request.
  await connection();
  return isSupabaseConfigured() ? createClient() : null;
}

export type PublicFaq = { question: string; answer: string };

export const listFaqs = cache(async (): Promise<{ items: PublicFaq[]; fromContent: boolean }> => {
  const supabase = await client();
  if (supabase) {
    const { data, error } = await supabase
      .from("faqs")
      .select("question, answer")
      .eq("is_published", true)
      .order("sort_order")
      .order("question");
    if (error) console.error("listFaqs", error);
    else if (data.length > 0) return { items: data, fromContent: false };
  }
  return { items: draftFaqs, fromContent: true };
});

export type PublicPartner = {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
};

/** Published partners in admin order; empty until the admin publishes one. */
export const listPartners = cache(async (): Promise<PublicPartner[]> => {
  const supabase = await client();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("partners")
    .select("id, name, kind, description, logo_path, website_url")
    .eq("is_published", true)
    .order("sort_order")
    .order("name");
  if (error) {
    console.error("listPartners", error);
    return [];
  }
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    description: p.description,
    logoUrl: mediaUrl(p.logo_path),
    websiteUrl: p.website_url,
  }));
});

export type PublicPromotion = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number | null;
  originalPriceCents: number | null;
  validFrom: string | null;
  validUntil: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
};

/**
 * Published, not yet expired promotions in admin order. Until the admin publishes one, the three draft
 * packages from Figma are shown instead (`fromContent`), with a contact button and no price.
 */
export const listPromotions = cache(async (): Promise<{ items: PublicPromotion[]; fromContent: boolean }> => {
  const supabase = await client();
  if (supabase) {
    const { data, error } = await supabase
      .from("promotions")
      .select("id, title, description, price_cents, original_price_cents, valid_from, valid_until, cta_label, cta_url, image_path")
      .eq("is_published", true)
      .order("sort_order")
      .order("title");
    if (error) console.error("listPromotions", error);
    else {
      const now = new Date().toISOString();
      // RLS already hides expired ones; this also covers an admin looking at the public page.
      const current = data.filter((p) => !p.valid_until || p.valid_until > now);
      if (current.length > 0) {
        return {
          fromContent: false,
          items: current.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            priceCents: p.price_cents,
            originalPriceCents: p.original_price_cents,
            validFrom: p.valid_from,
            validUntil: p.valid_until,
            ctaLabel: p.cta_label,
            ctaUrl: p.cta_url,
            imageUrl: mediaUrl(p.image_path),
          })),
        };
      }
    }
  }
  return {
    fromContent: true,
    items: servicePackages.map((p, i) => ({
      id: `draft-${i}`,
      title: p.title,
      description: p.text,
      priceCents: null,
      originalPriceCents: null,
      validFrom: null,
      validUntil: null,
      ctaLabel: null,
      ctaUrl: null,
      imageUrl: null,
    })),
  };
});
