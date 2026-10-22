-- Foundation: extensions, enum types, shared helpers, settings, profiles and roles.
--
-- Conventions used throughout the schema:
--   * All timestamps are timestamptz (stored in UTC); the UI renders them in Europe/Sofia.
--   * Money is stored as integer euro cents (amount_cents / price_cents), currency is always EUR.
--   * Business errors are raised with SQLSTATE P0001 and a stable snake_case message key
--     (e.g. 'event_full'); the frontend maps those keys to Bulgarian messages.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'specialist');
create type public.account_status as enum ('active', 'suspended');
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.event_format as enum ('in_person', 'online', 'hybrid');
create type public.registration_status as enum ('pending_payment', 'confirmed', 'cancelled', 'expired');
create type public.booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'completed', 'no_show', 'expired');
create type public.payment_provider as enum ('stripe', 'bank_transfer');
create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded');
create type public.subscription_status as enum (
  'pending_bank_transfer', -- waiting for an admin to confirm the first bank transfer
  'incomplete',            -- Stripe: first payment not completed yet
  'trialing',
  'active',
  'past_due',              -- Stripe: renewal failed, retries in progress (access kept for a grace period)
  'canceled',
  'unpaid',
  'expired'
);
create type public.billing_interval as enum ('month', 'year');
create type public.viber_access_status as enum ('pending_invite', 'invited', 'joined', 'removal_pending', 'removed');
create type public.email_status as enum ('queued', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Shared trigger helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Application settings (single row, editable by admins)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id boolean primary key default true check (id),
  timezone text not null default 'Europe/Sofia',
  currency text not null default 'EUR' check (currency = 'EUR'),

  -- Payments
  checkout_hold_minutes integer not null default 30
    check (checkout_hold_minutes between 30 and 1440), -- Stripe Checkout sessions live at least 30 min
  bank_transfer_hold_days integer not null default 5
    check (bank_transfer_hold_days between 1 and 30),
  bank_transfer_beneficiary text,
  bank_transfer_iban text,
  bank_transfer_bic text,
  bank_transfer_bank_name text,

  -- Subscriptions
  subscriptions_allow_bank_transfer boolean not null default true, -- confirmed by Sisi 2026-10-22
  -- Card (Stripe) renewals that fail keep access for this many days while Stripe retries.
  -- Bank-transfer members have no extra grace: access lasts to the end of the month already paid
  -- (decided by Sisi, 2026-10-22).
  subscription_past_due_grace_days integer not null default 7
    check (subscription_past_due_grace_days between 0 and 60),
  subscription_renewal_window_days integer not null default 14
    check (subscription_renewal_window_days between 1 and 60), -- how early a bank-transfer renewal can be started

  -- Events
  event_cancel_deadline_hours integer not null default 48
    check (event_cancel_deadline_hours >= 0),

  -- Consultations
  consultation_min_notice_hours integer not null default 24
    check (consultation_min_notice_hours >= 0),
  consultation_max_advance_days integer not null default 60
    check (consultation_max_advance_days between 1 and 365),
  consultation_cancel_deadline_hours integer not null default 24
    check (consultation_cancel_deadline_hours >= 0),
  consultation_max_reschedules integer not null default 2
    check (consultation_max_reschedules >= 0),
  consultation_slot_step_minutes integer not null default 30
    check (consultation_slot_step_minutes between 5 and 240),

  updated_at timestamptz not null default now()
);

comment on table public.app_settings is
  'Single-row table with business rules that admins can change without a deploy.';

insert into public.app_settings default values;

create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  status public.account_status not null default 'active',
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Personal data for each account. Keep to the minimum the client confirms (spec 5.1, open question 3).';

create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when Supabase Auth creates a user.
-- The sign-up form passes first_name, last_name, phone and the consent flags as user metadata.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, first_name, last_name, phone,
                               terms_accepted_at, privacy_accepted_at,
                               marketing_consent, marketing_consent_at)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(left(meta ->> 'first_name', 100), ''),
    coalesce(left(meta ->> 'last_name', 100), ''),
    nullif(meta ->> 'phone', ''),
    case when (meta ->> 'terms_accepted')::boolean then now() end,
    case when (meta ->> 'privacy_accepted')::boolean then now() end,
    coalesce((meta ->> 'marketing_consent')::boolean, false),
    case when (meta ->> 'marketing_consent')::boolean then now() end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep profiles.email in sync when the user changes their email in Supabase Auth.
create function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_auth_user_email_change();

-- ---------------------------------------------------------------------------
-- Roles. Every account is a "user"; extra roles are granted here by admins.
-- ---------------------------------------------------------------------------

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create function public.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role = p_role
      and p.status = 'active'
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

-- True when the request uses the service-role key (trusted server code, webhooks, cron).
create function public.is_service_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.role(), '') = 'service_role';
$$;

-- Never allow the last admin role to disappear.
create function public.prevent_last_admin_removal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and not exists (
    select 1 from public.user_roles
    where role = 'admin' and user_id <> old.user_id
  ) then
    raise exception using errcode = 'P0001', message = 'last_admin';
  end if;
  return old;
end;
$$;

create trigger user_roles_keep_one_admin
  before delete on public.user_roles
  for each row execute function public.prevent_last_admin_removal();

-- Non-admins may edit their own profile, but not its protected columns.
create function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.status is distinct from old.status
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = 'P0001', message = 'profile_field_protected';
  end if;
  if new.marketing_consent is distinct from old.marketing_consent then
    new.marketing_consent_at = case when new.marketing_consent then now() end;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Small helpers used by the business functions.
create function public.app_setting()
returns public.app_settings
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.app_settings where id;
$$;

create function public.require_active_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = 'P0001', message = 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and status = 'active') then
    raise exception using errcode = 'P0001', message = 'account_suspended';
  end if;
  return v_uid;
end;
$$;

create function public.require_admin_or_service()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not (public.is_service_role() or public.is_admin()) then
    raise exception using errcode = 'P0001', message = 'forbidden';
  end if;
end;
$$;
