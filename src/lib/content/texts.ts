import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { editableTexts } from "@/content/editable-texts";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const defaults = new Map(editableTexts.map((t) => [t.key, t.defaultValue]));

/** The value stored in content_blocks.value (jsonb): a JSON string, or { "text": "…" }. */
export function blockText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "text" in value && typeof (value as { text: unknown }).text === "string") {
    return (value as { text: string }).text;
  }
  return null;
}

/** The admin's saved texts, read once per request. Missing or unreadable ones fall back to the defaults. */
const savedTexts = cache(async (): Promise<Map<string, string>> => {
  await connection();
  if (!isSupabaseConfigured()) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase.from("content_blocks").select("key, value").eq("is_published", true);
  if (error) {
    console.error("content_blocks", error);
    return new Map();
  }
  return new Map(data.flatMap((row) => {
    const text = blockText(row.value);
    return text?.trim() ? [[row.key, text] as const] : [];
  }));
});

/** Returns a getter: the saved text for a key, or its built-in default. */
export async function getTexts(): Promise<(key: string) => string> {
  const saved = await savedTexts();
  return (key) => saved.get(key) ?? defaults.get(key) ?? "";
}

/** Splits a "one per line" text into its non-empty lines. */
export const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
