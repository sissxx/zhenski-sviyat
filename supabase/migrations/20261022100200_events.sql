-- Events and event registrations (spec section 6).

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  summary text,
  description text,
  status public.event_status not null default 'draft',
  format public.event_format not null default 'in_person',
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  city text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  capacity integer check (capacity is null or capacity > 0),     -- null = unlimited
  registration_opens_at timestamptz,
  registration_deadline timestamptz,
  allow_bank_transfer boolean not null default true,
  cancellation_deadline_hours integer check (cancellation_deadline_hours is null or cancellation_deadline_hours >= 0),
  cover_image_path text,
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (registration_deadline is null or registration_opens_at is null or registration_deadline > registration_opens_at)
);

comment on column public.events.cancellation_deadline_hours is
  'Hours before start after which attendees can no longer cancel. Null = app_settings.event_cancel_deadline_hours.';

create index events_status_starts_idx on public.events (status, starts_at);

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- Details only confirmed attendees should see (meeting link, door code, etc.).
create table public.event_private_details (
  event_id uuid primary key references public.events (id) on delete cascade,
  online_url text,
  attendee_instructions text,
  updated_at timestamptz not null default now()
);

create trigger event_private_details_updated_at before update on public.event_private_details
  for each row execute function public.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.registration_status not null,
  price_cents integer not null check (price_cents >= 0),          -- price snapshot at registration time
  payment_method public.payment_provider,                          -- null for free events
  hold_expires_at timestamptz,                                     -- seat is held until then while unpaid
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancellation_reason text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'pending_payment' or hold_expires_at is not null)
);

-- One live registration per user and event (spec 6.3 / 6.5).
create unique index event_registrations_one_active_idx
  on public.event_registrations (event_id, user_id)
  where status in ('pending_payment', 'confirmed');

create index event_registrations_user_idx on public.event_registrations (user_id, created_at desc);
create index event_registrations_event_status_idx on public.event_registrations (event_id, status);

create trigger event_registrations_updated_at before update on public.event_registrations
  for each row execute function public.set_updated_at();

-- Seats in use: confirmed registrations plus unexpired payment holds.
create function public.event_seats_taken(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.event_registrations r
  where r.event_id = p_event_id
    and (r.status = 'confirmed'
         or (r.status = 'pending_payment' and r.hold_expires_at > now()));
$$;

-- Public listing with availability. security_invoker keeps the events RLS (no drafts for the public).
create view public.event_listing
with (security_invoker = true)
as
select
  e.*,
  public.event_seats_taken(e.id) as seats_taken,
  case when e.capacity is null then null
       else greatest(e.capacity - public.event_seats_taken(e.id), 0) end as seats_left,
  (e.capacity is not null and public.event_seats_taken(e.id) >= e.capacity) as is_full,
  (e.status = 'published'
   and e.starts_at > now()
   and (e.registration_opens_at is null or e.registration_opens_at <= now())
   and (e.registration_deadline is null or e.registration_deadline > now())) as registration_open
from public.events e;
