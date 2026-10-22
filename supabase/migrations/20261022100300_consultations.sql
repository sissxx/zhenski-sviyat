-- Individual consultations: specialists, services, availability and bookings (spec section 7).

create table public.specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete set null, -- set when the specialist has a login
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  full_name text not null,
  title text,
  bio text,
  photo_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contact data that must not be public.
create table public.specialist_private (
  specialist_id uuid primary key references public.specialists (id) on delete cascade,
  notification_email text,
  phone text,
  internal_note text,
  updated_at timestamptz not null default now()
);

create table public.consultation_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 10 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120), -- gap kept free after a session
  price_cents integer not null default 0 check (price_cents >= 0),
  requires_prepayment boolean not null default true, -- false = paid on site / free
  allow_bank_transfer boolean not null default false,
  location_info text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which specialist offers which consultation type (optional per-specialist price).
create table public.specialist_consultation_types (
  specialist_id uuid not null references public.specialists (id) on delete cascade,
  consultation_type_id uuid not null references public.consultation_types (id) on delete cascade,
  price_cents_override integer check (price_cents_override is null or price_cents_override >= 0),
  primary key (specialist_id, consultation_type_id)
);

-- Weekly working hours, in local (Europe/Sofia) time.
create table public.specialist_availability (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = Monday ... 7 = Sunday
  start_time time not null,
  end_time time not null,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  check (valid_until is null or valid_from is null or valid_until >= valid_from)
);

create index specialist_availability_idx on public.specialist_availability (specialist_id, weekday);

-- Holidays, sick days and other blocked periods.
create table public.specialist_time_off (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index specialist_time_off_idx on public.specialist_time_off (specialist_id, starts_at);

create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  specialist_id uuid not null references public.specialists (id) on delete restrict,
  consultation_type_id uuid not null references public.consultation_types (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  blocked_until timestamptz not null, -- ends_at + buffer; the specialist is busy until then
  status public.booking_status not null,
  price_cents integer not null check (price_cents >= 0),
  payment_method public.payment_provider,
  hold_expires_at timestamptz,
  user_note text check (char_length(user_note) <= 2000),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  cancellation_reason text,
  reschedule_count integer not null default 0,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  during tstzrange generated always as (tstzrange(starts_at, blocked_until, '[)')) stored,
  check (ends_at > starts_at),
  check (blocked_until >= ends_at),
  check (status <> 'pending_payment' or hold_expires_at is not null),

  -- The core double-booking guard (spec 7.2): two live bookings of one specialist can never overlap.
  -- It is enforced by Postgres itself, so it also holds under concurrent requests.
  constraint consultation_bookings_no_overlap
    exclude using gist (specialist_id with =, during with &&)
    where (status in ('pending_payment', 'confirmed')),

  -- A client cannot hold two overlapping appointments either.
  constraint consultation_bookings_user_no_overlap
    exclude using gist (user_id with =, during with &&)
    where (status in ('pending_payment', 'confirmed'))
);

create index consultation_bookings_user_idx on public.consultation_bookings (user_id, starts_at desc);
create index consultation_bookings_specialist_idx on public.consultation_bookings (specialist_id, starts_at);

create trigger specialists_updated_at before update on public.specialists
  for each row execute function public.set_updated_at();
create trigger specialist_private_updated_at before update on public.specialist_private
  for each row execute function public.set_updated_at();
create trigger consultation_types_updated_at before update on public.consultation_types
  for each row execute function public.set_updated_at();
create trigger consultation_bookings_updated_at before update on public.consultation_bookings
  for each row execute function public.set_updated_at();

-- The specialist record of the signed-in user, if any.
create function public.my_specialist_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.id from public.specialists s where s.user_id = auth.uid();
$$;

-- True when the given user has (or had) a booking with the signed-in specialist.
-- Lets specialists see the contact details of their own clients and nobody else (spec 12.2).
create function public.is_client_of_my_specialist(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.consultation_bookings b
    join public.specialists s on s.id = b.specialist_id
    where b.user_id = p_user_id
      and s.user_id = auth.uid()
  );
$$;
