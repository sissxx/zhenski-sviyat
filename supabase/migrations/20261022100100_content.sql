-- Editable website content managed from the admin panel (spec 4.2).

-- Free-form text blocks for page copy, keyed by location, e.g. 'home.hero.title'.
create table public.content_blocks (
  key text primary key check (key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)*$'),
  value jsonb not null,
  description text,
  is_published boolean not null default true,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  full_name text not null,
  role_title text,
  bio text,
  photo_path text,
  member_group text not null default 'founder' check (member_group in ('founder', 'team', 'ambassador')),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'partner' check (kind in ('partner', 'supporter', 'sponsor', 'media')),
  description text,
  logo_path text,
  website_url text check (website_url is null or website_url ~ '^https?://'),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  link_url text,
  image_path text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- "Packages and promotions" page. Display only: no coupon engine in the MVP (spec 22).
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  original_price_cents integer check (original_price_cents is null or original_price_cents >= 0),
  valid_from timestamptz,
  valid_until timestamptz,
  cta_label text,
  cta_url text,
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);

-- Messages from the Contacts page. Inserted by the server route (service role) after spam checks.
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) <= 200),
  email text not null check (char_length(email) <= 320),
  phone text,
  subject text check (char_length(subject) <= 300),
  message text not null check (char_length(message) <= 5000),
  privacy_accepted boolean not null default false,
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create trigger content_blocks_updated_at before update on public.content_blocks
  for each row execute function public.set_updated_at();
create trigger team_members_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();
create trigger partners_updated_at before update on public.partners
  for each row execute function public.set_updated_at();
create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();
create trigger promotions_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();
