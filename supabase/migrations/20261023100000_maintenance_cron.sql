-- Runs run_maintenance() every 10 minutes inside the database (Supabase pg_cron), as docs/database.md asks.
-- Vercel Hobby crons can only run once a day, which is too rare for expiring unpaid holds and payments.
--
-- run_maintenance() only runs for admins or the service role, so the job first sets the service_role claim that
-- auth.role() reads. pg_cron sends the command as one query string, which Postgres runs as one transaction, so
-- the transaction-local setting is still in place for the second statement.

create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'run-maintenance') then
    perform cron.unschedule('run-maintenance');
  end if;
end;
$$;

select cron.schedule(
  'run-maintenance',
  '*/10 * * * *',
  $job$select set_config('request.jwt.claims', '{"role":"service_role"}', true); select public.run_maintenance();$job$
);
