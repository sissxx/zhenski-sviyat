-- Transactional email log (spec 11) and the admin audit trail (spec 13.2).

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  to_email text not null,
  template_key text not null,           -- e.g. 'event_registration_confirmed'
  dedupe_key text unique,               -- e.g. 'booking_reminder:<booking id>' so a mail is never sent twice
  status public.email_status not null default 'queued',
  provider_message_id text,             -- Brevo message id
  related_table text,
  related_id uuid,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index email_log_related_idx on public.email_log (related_table, related_id);
create index email_log_status_idx on public.email_log (status, created_at);

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,                        -- null for service-role/system changes
  actor_role text,
  action text not null,                 -- INSERT / UPDATE / DELETE
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);

create index audit_log_table_record_idx on public.audit_log (table_name, record_id);
create index audit_log_occurred_idx on public.audit_log (occurred_at desc);

-- Generic row-change logger. For updates only the changed columns are stored.
create function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_key text;
begin
  if tg_op = 'UPDATE' then
    for v_key in select jsonb_object_keys(v_new) loop
      if v_old -> v_key = v_new -> v_key then
        v_old := v_old - v_key;
        v_new := v_new - v_key;
      end if;
    end loop;
    v_old := v_old - 'updated_at';
    v_new := v_new - 'updated_at';
    if v_new = '{}'::jsonb then
      return null;
    end if;
  end if;

  insert into public.audit_log (actor_id, actor_role, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    coalesce(auth.role(), current_user),
    tg_op,
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id',
             (coalesce(to_jsonb(new), to_jsonb(old)) ->> 'user_id') || ':' ||
             coalesce(coalesce(to_jsonb(new), to_jsonb(old)) ->> 'role', '')),
    v_old,
    v_new
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings', 'user_roles',
    'events', 'event_registrations',
    'specialists', 'consultation_types', 'consultation_bookings',
    'membership_plans', 'plan_viber_groups', 'viber_groups', 'viber_group_invites',
    'subscriptions', 'viber_memberships', 'payments'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.audit_row_change()',
      t || '_audit', t);
  end loop;
end;
$$;

-- Profiles hold personal data, so only account-status changes are audited.
create trigger profiles_status_audit
  after update of status on public.profiles
  for each row
  when (old.status is distinct from new.status)
  execute function public.audit_row_change();
