-- Payments for events, consultations and subscriptions, via Stripe or bank transfer (spec section 10).

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null, -- kept for accounting if the account is deleted
  provider public.payment_provider not null,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  description text,

  -- What the payment is for (at most one; all can become null if the record is deleted).
  event_registration_id uuid references public.event_registrations (id) on delete set null,
  consultation_booking_id uuid references public.consultation_bookings (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,

  -- Reference the payer writes in the bank transfer description.
  bank_reference text unique
    default ('NSJS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_invoice_id text unique,

  expires_at timestamptz,             -- pending payments expire with the seat/slot hold
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  refunded_amount_cents integer not null default 0 check (refunded_amount_cents >= 0),
  refunded_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null, -- admin who confirmed a bank transfer
  needs_review boolean not null default false, -- e.g. paid after the hold expired and the seat was gone
  review_reason text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(event_registration_id, consultation_booking_id, subscription_id) <= 1),
  check (refunded_amount_cents <= amount_cents)
);

create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_status_idx on public.payments (provider, status);
create index payments_registration_idx on public.payments (event_registration_id);
create index payments_booking_idx on public.payments (consultation_booking_id);
create index payments_subscription_idx on public.payments (subscription_id);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Stripe customer per user, so repeat purchases and subscriptions share one customer.
create table public.stripe_customers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

-- Every Stripe webhook event, stored once. Inserting with ON CONFLICT DO NOTHING makes
-- processing idempotent: a repeated delivery finds the row and is skipped (spec 10.2).
create table public.stripe_webhook_events (
  id text primary key,                 -- Stripe event id (evt_...)
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0,
  last_error text
);

create index stripe_webhook_events_unprocessed_idx
  on public.stripe_webhook_events (received_at)
  where processed_at is null;
