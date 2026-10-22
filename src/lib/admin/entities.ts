import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  centsToEuros,
  emptyToNull,
  eurosToCents,
  intToString,
  isoToLocalDateTime,
  linesToList,
  listToLines,
  optionalEurosToCents,
  optionalInt,
  optionalLocalDateTimeToIso,
  localDateTimeToIso,
  type FormValues,
} from "./convert";
import type { EntityKey } from "./forms";
import { adminRoutes } from "./routes";

/**
 * How each admin editor maps to the database: the table, how form values become a row and back, and the
 * extra tables some editors also write (private event details, specialist contact data, Viber invite links).
 * Every query runs as the signed-in admin, so RLS checks each write.
 */

type Client = SupabaseClient<Database>;
type TableName = keyof Database["public"]["Tables"];
type Row = Record<string, unknown>;

type EntityConfig = {
  table: TableName;
  listPath: string;
  /** Form values for a new item. */
  defaults: FormValues;
  toRow: (v: FormValues) => Row;
  toForm: (row: Row) => FormValues;
  /** Writes to the item's satellite tables after the main row is saved. */
  afterSave?: (supabase: Client, id: string, v: FormValues) => Promise<{ error: { code?: string; message?: string } | null }>;
  /** Reads the satellite tables into form values. */
  loadExtra?: (supabase: Client, id: string) => Promise<FormValues>;
};

const str = (v: FormValues, key: string) => {
  const value = v[key];
  return typeof value === "string" ? value : "";
};
const text = (v: FormValues, key: string) => str(v, key).trim();
const opt = (v: FormValues, key: string) => emptyToNull(str(v, key));
const flag = (v: FormValues, key: string) => v[key] === true;
const sort = (v: FormValues) => optionalInt(str(v, "sort_order")) ?? 0;

const s = (row: Row, key: string) => (row[key] === null || row[key] === undefined ? "" : String(row[key]));
const b = (row: Row, key: string) => row[key] === true;

const ok = { error: null };

export const entities: Record<Exclude<EntityKey, "settings">, EntityConfig> = {
  event: {
    table: "events",
    listPath: adminRoutes.events,
    defaults: {
      title: "", slug: "", summary: "", description: "", status: "draft", format: "in_person", is_featured: false,
      starts_at: "", ends_at: "", venue_name: "", venue_address: "", city: "", price: "0", capacity: "",
      allow_bank_transfer: true, registration_opens_at: "", registration_deadline: "", cancellation_deadline_hours: "",
      cover_image_path: "", online_url: "", attendee_instructions: "",
    },
    toRow: (v) => ({
      title: text(v, "title"),
      slug: text(v, "slug"),
      summary: opt(v, "summary"),
      description: opt(v, "description"),
      status: str(v, "status"),
      format: str(v, "format"),
      is_featured: flag(v, "is_featured"),
      starts_at: localDateTimeToIso(str(v, "starts_at")),
      ends_at: optionalLocalDateTimeToIso(str(v, "ends_at")),
      venue_name: opt(v, "venue_name"),
      venue_address: opt(v, "venue_address"),
      city: opt(v, "city"),
      price_cents: eurosToCents(str(v, "price")),
      capacity: optionalInt(str(v, "capacity")),
      allow_bank_transfer: flag(v, "allow_bank_transfer"),
      registration_opens_at: optionalLocalDateTimeToIso(str(v, "registration_opens_at")),
      registration_deadline: optionalLocalDateTimeToIso(str(v, "registration_deadline")),
      cancellation_deadline_hours: optionalInt(str(v, "cancellation_deadline_hours")),
      cover_image_path: opt(v, "cover_image_path"),
    }),
    toForm: (row) => ({
      title: s(row, "title"),
      slug: s(row, "slug"),
      summary: s(row, "summary"),
      description: s(row, "description"),
      status: s(row, "status"),
      format: s(row, "format"),
      is_featured: b(row, "is_featured"),
      starts_at: isoToLocalDateTime(row.starts_at as string),
      ends_at: isoToLocalDateTime(row.ends_at as string | null),
      venue_name: s(row, "venue_name"),
      venue_address: s(row, "venue_address"),
      city: s(row, "city"),
      price: centsToEuros(row.price_cents as number),
      capacity: intToString(row.capacity as number | null),
      allow_bank_transfer: b(row, "allow_bank_transfer"),
      registration_opens_at: isoToLocalDateTime(row.registration_opens_at as string | null),
      registration_deadline: isoToLocalDateTime(row.registration_deadline as string | null),
      cancellation_deadline_hours: intToString(row.cancellation_deadline_hours as number | null),
      cover_image_path: s(row, "cover_image_path"),
    }),
    afterSave: async (supabase, id, v) => {
      const { error } = await supabase.from("event_private_details").upsert({
        event_id: id,
        online_url: opt(v, "online_url"),
        attendee_instructions: opt(v, "attendee_instructions"),
      });
      if (error) return { error };
      // Remember when an event first went public, for sorting "new" events.
      if (str(v, "status") === "published") {
        await supabase.from("events").update({ published_at: new Date().toISOString() }).eq("id", id).is("published_at", null);
      }
      return ok;
    },
    loadExtra: async (supabase, id) => {
      const { data } = await supabase.from("event_private_details").select("*").eq("event_id", id).maybeSingle();
      return { online_url: data?.online_url ?? "", attendee_instructions: data?.attendee_instructions ?? "" };
    },
  },

  consultationType: {
    table: "consultation_types",
    listPath: adminRoutes.consultationTypes,
    defaults: {
      name: "", slug: "", description: "", duration_minutes: "60", buffer_minutes: "0", price: "0",
      requires_prepayment: true, allow_bank_transfer: false, location_info: "", is_active: true, sort_order: "0",
    },
    toRow: (v) => ({
      name: text(v, "name"),
      slug: text(v, "slug"),
      description: opt(v, "description"),
      duration_minutes: Number(str(v, "duration_minutes")),
      buffer_minutes: Number(str(v, "buffer_minutes")),
      price_cents: eurosToCents(str(v, "price")),
      requires_prepayment: flag(v, "requires_prepayment"),
      allow_bank_transfer: flag(v, "allow_bank_transfer"),
      location_info: opt(v, "location_info"),
      is_active: flag(v, "is_active"),
      sort_order: sort(v),
    }),
    toForm: (row) => ({
      name: s(row, "name"),
      slug: s(row, "slug"),
      description: s(row, "description"),
      duration_minutes: s(row, "duration_minutes"),
      buffer_minutes: s(row, "buffer_minutes"),
      price: centsToEuros(row.price_cents as number),
      requires_prepayment: b(row, "requires_prepayment"),
      allow_bank_transfer: b(row, "allow_bank_transfer"),
      location_info: s(row, "location_info"),
      is_active: b(row, "is_active"),
      sort_order: s(row, "sort_order"),
    }),
  },

  specialist: {
    table: "specialists",
    listPath: adminRoutes.specialists,
    defaults: {
      full_name: "", slug: "", title: "", bio: "", photo_path: "", is_active: true, sort_order: "0",
      login_email: "", notification_email: "", phone: "", internal_note: "",
    },
    toRow: (v) => ({
      full_name: text(v, "full_name"),
      slug: text(v, "slug"),
      title: opt(v, "title"),
      bio: opt(v, "bio"),
      photo_path: opt(v, "photo_path"),
      is_active: flag(v, "is_active"),
      sort_order: sort(v),
    }),
    toForm: (row) => ({
      full_name: s(row, "full_name"),
      slug: s(row, "slug"),
      title: s(row, "title"),
      bio: s(row, "bio"),
      photo_path: s(row, "photo_path"),
      is_active: b(row, "is_active"),
      sort_order: s(row, "sort_order"),
    }),
    afterSave: async (supabase, id, v) => {
      const { error } = await supabase.from("specialist_private").upsert({
        specialist_id: id,
        notification_email: opt(v, "notification_email"),
        phone: opt(v, "phone"),
        internal_note: opt(v, "internal_note"),
      });
      if (error) return { error };
      return linkSpecialistLogin(supabase, id, opt(v, "login_email"));
    },
    loadExtra: async (supabase, id) => {
      const [{ data: priv }, { data: spec }] = await Promise.all([
        supabase.from("specialist_private").select("*").eq("specialist_id", id).maybeSingle(),
        supabase.from("specialists").select("user_id, profiles(email)").eq("id", id).maybeSingle(),
      ]);
      return {
        notification_email: priv?.notification_email ?? "",
        phone: priv?.phone ?? "",
        internal_note: priv?.internal_note ?? "",
        login_email: spec?.profiles?.email ?? "",
      };
    },
  },

  plan: {
    table: "membership_plans",
    listPath: adminRoutes.plans,
    defaults: {
      name: "", slug: "", description: "", features: "", price: "", billing_interval: "month", stripe_price_id: "",
      allow_bank_transfer: true, is_active: true, sort_order: "0",
    },
    toRow: (v) => ({
      name: text(v, "name"),
      slug: text(v, "slug"),
      description: opt(v, "description"),
      features: linesToList(str(v, "features")),
      price_cents: eurosToCents(str(v, "price")),
      billing_interval: str(v, "billing_interval"),
      stripe_price_id: opt(v, "stripe_price_id"),
      allow_bank_transfer: flag(v, "allow_bank_transfer"),
      is_active: flag(v, "is_active"),
      sort_order: sort(v),
    }),
    toForm: (row) => ({
      name: s(row, "name"),
      slug: s(row, "slug"),
      description: s(row, "description"),
      features: listToLines(row.features),
      price: centsToEuros(row.price_cents as number),
      billing_interval: s(row, "billing_interval"),
      stripe_price_id: s(row, "stripe_price_id"),
      allow_bank_transfer: b(row, "allow_bank_transfer"),
      is_active: b(row, "is_active"),
      sort_order: s(row, "sort_order"),
    }),
  },

  viberGroup: {
    table: "viber_groups",
    listPath: adminRoutes.viber,
    defaults: { name: "", slug: "", description: "", invite_link: "", join_instructions: "", is_active: true, sort_order: "0" },
    toRow: (v) => ({
      name: text(v, "name"),
      slug: text(v, "slug"),
      description: opt(v, "description"),
      is_active: flag(v, "is_active"),
      sort_order: sort(v),
    }),
    toForm: (row) => ({
      name: s(row, "name"),
      slug: s(row, "slug"),
      description: s(row, "description"),
      is_active: b(row, "is_active"),
      sort_order: s(row, "sort_order"),
    }),
    afterSave: async (supabase, id, v) => {
      const { error } = await supabase.from("viber_group_invites").upsert({
        viber_group_id: id,
        invite_link: opt(v, "invite_link"),
        join_instructions: opt(v, "join_instructions"),
      });
      return { error };
    },
    loadExtra: async (supabase, id) => {
      const { data } = await supabase.from("viber_group_invites").select("*").eq("viber_group_id", id).maybeSingle();
      return { invite_link: data?.invite_link ?? "", join_instructions: data?.join_instructions ?? "" };
    },
  },

  faq: {
    table: "faqs",
    listPath: adminRoutes.faqs,
    defaults: { question: "", answer: "", category: "", sort_order: "0", is_published: false },
    toRow: (v) => ({
      question: text(v, "question"),
      answer: text(v, "answer"),
      category: opt(v, "category"),
      sort_order: sort(v),
      is_published: flag(v, "is_published"),
    }),
    toForm: (row) => ({
      question: s(row, "question"),
      answer: s(row, "answer"),
      category: s(row, "category"),
      sort_order: s(row, "sort_order"),
      is_published: b(row, "is_published"),
    }),
  },

  partner: {
    table: "partners",
    listPath: adminRoutes.partners,
    defaults: { name: "", kind: "partner", description: "", logo_path: "", website_url: "", sort_order: "0", is_published: false },
    toRow: (v) => ({
      name: text(v, "name"),
      kind: str(v, "kind"),
      description: opt(v, "description"),
      logo_path: opt(v, "logo_path"),
      website_url: opt(v, "website_url"),
      sort_order: sort(v),
      is_published: flag(v, "is_published"),
    }),
    toForm: (row) => ({
      name: s(row, "name"),
      kind: s(row, "kind"),
      description: s(row, "description"),
      logo_path: s(row, "logo_path"),
      website_url: s(row, "website_url"),
      sort_order: s(row, "sort_order"),
      is_published: b(row, "is_published"),
    }),
  },

  promotion: {
    table: "promotions",
    listPath: adminRoutes.promotions,
    defaults: {
      title: "", slug: "", description: "", price: "", original_price: "", valid_from: "", valid_until: "",
      cta_label: "", cta_url: "", image_path: "", sort_order: "0", is_published: false,
    },
    toRow: (v) => ({
      title: text(v, "title"),
      slug: text(v, "slug"),
      description: opt(v, "description"),
      price_cents: optionalEurosToCents(str(v, "price")),
      original_price_cents: optionalEurosToCents(str(v, "original_price")),
      valid_from: optionalLocalDateTimeToIso(str(v, "valid_from")),
      valid_until: optionalLocalDateTimeToIso(str(v, "valid_until")),
      cta_label: opt(v, "cta_label"),
      cta_url: opt(v, "cta_url"),
      image_path: opt(v, "image_path"),
      sort_order: sort(v),
      is_published: flag(v, "is_published"),
    }),
    toForm: (row) => ({
      title: s(row, "title"),
      slug: s(row, "slug"),
      description: s(row, "description"),
      price: centsToEuros(row.price_cents as number | null),
      original_price: centsToEuros(row.original_price_cents as number | null),
      valid_from: isoToLocalDateTime(row.valid_from as string | null),
      valid_until: isoToLocalDateTime(row.valid_until as string | null),
      cta_label: s(row, "cta_label"),
      cta_url: s(row, "cta_url"),
      image_path: s(row, "image_path"),
      sort_order: s(row, "sort_order"),
      is_published: b(row, "is_published"),
    }),
  },

  teamMember: {
    table: "team_members",
    listPath: adminRoutes.team,
    defaults: { full_name: "", slug: "", role_title: "", bio: "", photo_path: "", member_group: "founder", sort_order: "0", is_published: false },
    toRow: (v) => ({
      full_name: text(v, "full_name"),
      slug: text(v, "slug"),
      role_title: opt(v, "role_title"),
      bio: opt(v, "bio"),
      photo_path: opt(v, "photo_path"),
      member_group: str(v, "member_group"),
      sort_order: sort(v),
      is_published: flag(v, "is_published"),
    }),
    toForm: (row) => ({
      full_name: s(row, "full_name"),
      slug: s(row, "slug"),
      role_title: s(row, "role_title"),
      bio: s(row, "bio"),
      photo_path: s(row, "photo_path"),
      member_group: s(row, "member_group"),
      sort_order: s(row, "sort_order"),
      is_published: b(row, "is_published"),
    }),
  },

  announcement: {
    table: "announcements",
    listPath: adminRoutes.announcements,
    defaults: { title: "", body: "", link_url: "", image_path: "", starts_at: "", ends_at: "", is_published: false },
    toRow: (v) => ({
      title: text(v, "title"),
      body: opt(v, "body"),
      link_url: opt(v, "link_url"),
      image_path: opt(v, "image_path"),
      starts_at: optionalLocalDateTimeToIso(str(v, "starts_at")),
      ends_at: optionalLocalDateTimeToIso(str(v, "ends_at")),
      is_published: flag(v, "is_published"),
    }),
    toForm: (row) => ({
      title: s(row, "title"),
      body: s(row, "body"),
      link_url: s(row, "link_url"),
      image_path: s(row, "image_path"),
      starts_at: isoToLocalDateTime(row.starts_at as string | null),
      ends_at: isoToLocalDateTime(row.ends_at as string | null),
      is_published: b(row, "is_published"),
    }),
  },
};

/**
 * Links a specialist to the account with this email (or unlinks it when empty) and keeps the
 * specialist role in step, so the person sees their own schedule and bookings.
 */
async function linkSpecialistLogin(supabase: Client, specialistId: string, email: string | null) {
  const { data: current } = await supabase.from("specialists").select("user_id").eq("id", specialistId).single();
  let userId: string | null = null;
  if (email) {
    const { data: profile } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (!profile) return { error: { code: "admin", message: "login_email_not_found" } };
    userId = profile.id;
  }
  if (current?.user_id === userId) return ok;

  const { error } = await supabase.from("specialists").update({ user_id: userId }).eq("id", specialistId);
  if (error) return { error };
  if (userId) {
    const { error: roleError } = await supabase.from("user_roles").upsert({ user_id: userId, role: "specialist" }, { ignoreDuplicates: true });
    if (roleError) return { error: roleError };
  }
  if (current?.user_id) {
    await supabase.from("user_roles").delete().eq("user_id", current.user_id).eq("role", "specialist");
  }
  return ok;
}

/** Loads one item as form values, or null when it doesn't exist. */
export async function loadEntityForm(supabase: Client, key: Exclude<EntityKey, "settings">, id: string): Promise<FormValues | null> {
  const config = entities[key];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the table name is chosen at runtime from the registry
  const { data } = await (supabase.from(config.table) as any).select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const extra = config.loadExtra ? await config.loadExtra(supabase, id) : {};
  return { ...config.defaults, ...config.toForm(data as Row), ...extra };
}

export async function writeEntity(supabase: Client, key: Exclude<EntityKey, "settings">, id: string | null, values: FormValues) {
  const config = entities[key];
  const row = config.toRow(values);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the table name is chosen at runtime from the registry
  const table = supabase.from(config.table) as any;
  const { data, error } = id
    ? await table.update(row).eq("id", id).select("id").single()
    : await table.insert(row).select("id").single();
  if (error || !data) return { error: error ?? { code: "PGRST116" }, id: null };
  const savedId = (data as { id: string }).id;
  if (config.afterSave) {
    const { error: extraError } = await config.afterSave(supabase, savedId, values);
    if (extraError) return { error: extraError, id: savedId };
  }
  return { error: null, id: savedId };
}

export async function deleteEntity(supabase: Client, key: Exclude<EntityKey, "settings">, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the table name is chosen at runtime from the registry
  const { error } = await (supabase.from(entities[key].table) as any).delete().eq("id", id);
  return { error };
}
