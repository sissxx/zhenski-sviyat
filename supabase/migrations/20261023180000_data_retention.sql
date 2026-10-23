-- Deletes personal data once the retention periods in the privacy policy (src/content/legal/privacy.ts) have passed.
-- Runs once a day from pg_cron. Payments are not touched: accounting law keeps them for 10 years.
--
--   contact form messages   2 years after they were sent
--   email log               2 years
--   consultation notes      1 year after the session (the booking itself stays while the account exists)
--   audit log               3 years
--
-- Clearing a note fires the audit trigger on consultation_bookings, which would copy the note into audit_log,
-- so the note is also removed from that booking's audit rows.

create function public.purge_expired_personal_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_messages integer;
  v_emails integer;
  v_notes integer;
  v_audit integer;
  v_booking_ids text[];
begin
  if not (auth.role() = 'service_role' or public.is_admin()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  delete from public.contact_messages where created_at < now() - interval '2 years';
  get diagnostics v_messages = row_count;

  delete from public.email_log where created_at < now() - interval '2 years';
  get diagnostics v_emails = row_count;

  with cleared as (
    update public.consultation_bookings
       set user_note = null
     where user_note is not null
       and ends_at < now() - interval '1 year'
    returning id::text
  )
  select coalesce(array_agg(id), '{}') into v_booking_ids from cleared;
  v_notes := cardinality(v_booking_ids);

  if v_notes > 0 then
    update public.audit_log
       set old_data = old_data - 'user_note',
           new_data = new_data - 'user_note'
     where table_name = 'consultation_bookings'
       and record_id = any (v_booking_ids)
       and (old_data ? 'user_note' or new_data ? 'user_note');
  end if;

  delete from public.audit_log where occurred_at < now() - interval '3 years';
  get diagnostics v_audit = row_count;

  return jsonb_build_object(
    'contact_messages', v_messages,
    'email_log', v_emails,
    'consultation_notes', v_notes,
    'audit_log', v_audit
  );
end;
$$;

revoke execute on function public.purge_expired_personal_data() from public, anon, authenticated;
grant execute on function public.purge_expired_personal_data() to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-personal-data') then
    perform cron.unschedule('purge-personal-data');
  end if;
end;
$$;

-- 03:30 UTC every day. Same service_role claim trick as run-maintenance (20261023100000_maintenance_cron.sql).
select cron.schedule(
  'purge-personal-data',
  '30 3 * * *',
  $job$select set_config('request.jwt.claims', '{"role":"service_role"}', true); select public.purge_expired_personal_data();$job$
);
