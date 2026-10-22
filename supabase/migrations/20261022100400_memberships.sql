-- Membership plans, subscriptions and Viber community access (spec sections 8 and 9).

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  billing_interval public.billing_interval not null default 'month',
  stripe_product_id text unique,
  stripe_price_id text unique,
  allow_bank_transfer boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.membership_plans.stripe_price_id is
  'When the price changes, create a new Stripe Price and update this column; existing Stripe subscriptions keep their old price.';

create table public.viber_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invite links are only readable by eligible members and admins.
create table public.viber_group_invites (
  viber_group_id uuid primary key references public.viber_groups (id) on delete cascade,
  invite_link text,
  join_instructions text,
  updated_at timestamptz not null default now()
);

-- A plan grants access to one or more groups; a group can belong to several plans.
create table public.plan_viber_groups (
  plan_id uuid not null references public.membership_plans (id) on delete cascade,
  viber_group_id uuid not null references public.viber_groups (id) on delete cascade,
  primary key (plan_id, viber_group_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.membership_plans (id) on delete restrict,
  provider public.payment_provider not null,
  status public.subscription_status not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (provider <> 'stripe' or stripe_subscription_id is not null or status = 'incomplete'),
  check (current_period_end is null or current_period_start is null or current_period_end > current_period_start)
);

-- At most one live subscription per user and plan.
create unique index subscriptions_one_live_idx
  on public.subscriptions (user_id, plan_id)
  where status in ('pending_bank_transfer', 'incomplete', 'trialing', 'active', 'past_due');

create index subscriptions_user_idx on public.subscriptions (user_id);
create index subscriptions_period_end_idx on public.subscriptions (status, current_period_end);

-- Admin-tracked state of each member in each Viber group. Viber cannot be automated reliably,
-- so admins work through the viber_access_actions view and update these rows by hand (spec 9).
create table public.viber_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  viber_group_id uuid not null references public.viber_groups (id) on delete cascade,
  status public.viber_access_status not null default 'pending_invite',
  viber_phone text,
  viber_display_name text,
  requested_at timestamptz not null default now(),
  invited_at timestamptz,
  joined_at timestamptz,
  removed_at timestamptz,
  admin_note text,
  updated_at timestamptz not null default now(),
  unique (user_id, viber_group_id)
);

create trigger membership_plans_updated_at before update on public.membership_plans
  for each row execute function public.set_updated_at();
create trigger viber_groups_updated_at before update on public.viber_groups
  for each row execute function public.set_updated_at();
create trigger viber_group_invites_updated_at before update on public.viber_group_invites
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger viber_memberships_updated_at before update on public.viber_memberships
  for each row execute function public.set_updated_at();

-- Does this subscription currently give access to its plan's benefits?
create function public.subscription_grants_access(s public.subscriptions)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when s.status in ('active', 'trialing')
      then s.current_period_end is null or s.current_period_end > now()
    when s.status = 'past_due'
      then s.current_period_end is not null
       and s.current_period_end
           + make_interval(days => (select subscription_past_due_grace_days from public.app_settings where id))
           > now()
    else false
  end;
$$;

create function public.has_active_plan(p_user_id uuid, p_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = p_user_id
      and s.plan_id = p_plan_id
      and public.subscription_grants_access(s)
  );
$$;

-- Viber groups a user is currently entitled to through any active plan.
create function public.eligible_viber_group_ids(p_user_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select distinct pvg.viber_group_id
  from public.subscriptions s
  join public.plan_viber_groups pvg on pvg.plan_id = s.plan_id
  join public.viber_groups g on g.id = pvg.viber_group_id and g.is_active
  where s.user_id = p_user_id
    and public.subscription_grants_access(s);
$$;

create function public.is_eligible_for_viber_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and p_group_id in (select public.eligible_viber_group_ids(auth.uid()));
$$;
