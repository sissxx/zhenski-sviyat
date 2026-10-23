-- Reminder emails (roadmap item 3): before consultations and events, and before a bank-transfer membership
-- month runs out.
--
-- The site sends the emails (Brevo key and templates live in the Next.js app). The database decides what is due
-- (due_reminders) and, once an hour, asks the site to send it (request_reminder_run via pg_cron + pg_net).
-- email_log.dedupe_key makes each reminder go out once, however often the job runs.

-- ---------------------------------------------------------------------------
-- Admin settings: how early each reminder goes out. 0 switches that reminder off.
-- ---------------------------------------------------------------------------

alter table public.app_settings
  add column consultation_reminder_hours integer not null default 24
    check (consultation_reminder_hours between 0 and 168),
  add column event_reminder_hours integer not null default 24
    check (event_reminder_hours between 0 and 168),
  add column subscription_reminder_days integer not null default 5
    check (subscription_reminder_days between 0 and 30);

comment on column public.app_settings.consultation_reminder_hours is
  'Reminder email this many hours before a confirmed consultation. 0 = no reminder.';
comment on column public.app_settings.event_reminder_hours is
  'Reminder email this many hours before an event, to everyone with a confirmed place. 0 = no reminder.';
comment on column public.app_settings.subscription_reminder_days is
  'Reminder this many days before a bank-transfer membership period ends (never earlier than renewal opens). 0 = no reminder.';

-- ---------------------------------------------------------------------------
-- What is due now
-- ---------------------------------------------------------------------------

-- One row per reminder that should be sent now and hasn't been. dedupe_key is what sendEmail() stores in
-- email_log; it includes the start time (or period end), so a moved event, consultation or renewed period
-- gets its own reminder. Something booked or confirmed inside the window gets none: its confirmation is recent.
create function public.due_reminders()
returns table (kind text, target_id uuid, dedupe_key text)
language sql
stable
security definer
set search_path = ''
as $$
  with cfg as (select * from public.app_settings where id),
  due as (
    select 'consultation'::text as kind, b.id as target_id,
           'consultation_reminder:' || b.id || ':' || extract(epoch from b.starts_at)::bigint as dedupe_key
      from public.consultation_bookings b
      join public.profiles p on p.id = b.user_id and p.status = 'active'
      cross join cfg
     where cfg.consultation_reminder_hours > 0
       and b.status = 'confirmed'
       and b.starts_at > now()
       and b.starts_at <= now() + make_interval(hours => cfg.consultation_reminder_hours)
       and coalesce(b.confirmed_at, b.created_at) <= b.starts_at - make_interval(hours => cfg.consultation_reminder_hours)

    union all

    select 'event', r.id,
           'event_reminder:' || r.id || ':' || extract(epoch from e.starts_at)::bigint
      from public.event_registrations r
      join public.events e on e.id = r.event_id and e.status = 'published'
      join public.profiles p on p.id = r.user_id and p.status = 'active'
      cross join cfg
     where cfg.event_reminder_hours > 0
       and r.status = 'confirmed'
       and e.starts_at > now()
       and e.starts_at <= now() + make_interval(hours => cfg.event_reminder_hours)
       and coalesce(r.confirmed_at, r.created_at) <= e.starts_at - make_interval(hours => cfg.event_reminder_hours)

    union all

    -- Renewal can only be started subscription_renewal_window_days before the end, so never remind earlier.
    -- A member who already started the renewal (pending transfer) is reminded too, with the transfer details.
    select 'subscription', s.id,
           'subscription_renewal_reminder:' || s.id || ':' || extract(epoch from s.current_period_end)::bigint
      from public.subscriptions s
      join public.membership_plans pl on pl.id = s.plan_id
      join public.profiles p on p.id = s.user_id and p.status = 'active'
      cross join cfg
     where cfg.subscription_reminder_days > 0
       and s.provider = 'bank_transfer'
       and s.status = 'active'
       and not s.cancel_at_period_end
       and s.current_period_end > now()
       and s.current_period_end <= now() + make_interval(
             days => least(cfg.subscription_reminder_days, cfg.subscription_renewal_window_days))
       and (
         (pl.is_active and pl.allow_bank_transfer and cfg.subscriptions_allow_bank_transfer)
         or exists (select 1 from public.payments pay where pay.subscription_id = s.id and pay.status = 'pending')
       )
  )
  select due.kind, due.target_id, due.dedupe_key
    from due
   where not exists (select 1 from public.email_log l where l.dedupe_key = due.dedupe_key);
$$;

-- ---------------------------------------------------------------------------
-- Hourly trigger: pg_cron calls the site's /api/cron/reminders through pg_net
-- ---------------------------------------------------------------------------

create extension if not exists pg_net with schema extensions;

-- Reads the site address and the shared secret from Supabase Vault (secrets 'reminders_url' and
-- 'cron_secret', see docs/emails.md). Without them it does nothing, so the job is harmless until set up.
create function public.request_reminder_run()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'reminders_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if coalesce(v_url, '') = '' or coalesce(v_secret, '') = '' then
    return null;
  end if;
  return net.http_post(
    url := v_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end;
$$;

revoke execute on function public.due_reminders(), public.request_reminder_run() from public, anon, authenticated;
grant execute on function public.due_reminders(), public.request_reminder_run() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'send-reminders') then
    perform cron.unschedule('send-reminders');
  end if;
end;
$$;

-- Minute 5 of every hour, so reminders go out about on time ("24 hours before" means 23-24 hours before).
select cron.schedule('send-reminders', '5 * * * *', $job$select public.request_reminder_run();$job$);
