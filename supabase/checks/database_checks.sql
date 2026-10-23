-- Database behaviour checks: RLS isolation, booking conflicts, payments and Viber access (spec 15.2, 17.3).
--
-- Run against a local Supabase database after `supabase db reset` (the seed data may be there; CI runs it):
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/checks/database_checks.sql
-- Everything runs in one transaction that is rolled back, so the database is left unchanged.
-- Each failed check raises an exception; the script prints "ALL DATABASE CHECKS PASSED" at the end.

begin;

create schema checks;
grant usage on schema checks to anon, authenticated, service_role;

-- Runs a statement and asserts it fails with the given message (business error key or Postgres text).
create function checks.expect_error(p_sql text, p_message text)
returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected error "%" but statement succeeded: %', p_message, p_sql;
exception when others then
  if sqlerrm not like '%' || p_message || '%' then
    raise exception 'expected error "%" but got "%" for: %', p_message, sqlerrm, p_sql;
  end if;
end;
$$;

create function checks.ok(p_condition boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_condition is not true then
    raise exception 'CHECK FAILED: %', p_label;
  end if;
end;
$$;

grant execute on all functions in schema checks to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Every public table has RLS enabled
-- ---------------------------------------------------------------------------
select checks.ok(not exists (
  select 1 from pg_tables where schemaname = 'public' and not rowsecurity
), 'all public tables have RLS enabled');

-- ---------------------------------------------------------------------------
-- Fixtures (as the database owner)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.org', '{"first_name":"Ана","last_name":"Админ","terms_accepted":true}'),
  ('00000000-0000-0000-0000-00000000000b', 'alice@example.org', '{"first_name":"Алиса","last_name":"Петрова"}'),
  ('00000000-0000-0000-0000-00000000000c', 'bob@example.org',   '{"first_name":"Боряна","last_name":"Иванова"}'),
  ('00000000-0000-0000-0000-00000000000d', 'spec@example.org',  '{"first_name":"Сия","last_name":"Специалист"}');

select checks.ok((select count(*) = 4 from public.profiles where email like '%@example.org'), 'profiles created by auth trigger');
select checks.ok((select terms_accepted_at is not null from public.profiles
                   where id = '00000000-0000-0000-0000-00000000000a'), 'consent captured from sign-up metadata');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000000a', 'admin'),
  ('00000000-0000-0000-0000-00000000000d', 'specialist');

insert into public.events (id, slug, title, status, starts_at, price_cents, capacity) values
  ('10000000-0000-0000-0000-000000000001', 'free-talk', 'Безплатна лекция', 'published', now() + interval '10 days', 0, 50),
  ('10000000-0000-0000-0000-000000000002', 'paid-workshop', 'Платен уъркшоп', 'published', now() + interval '10 days', 2500, 1),
  ('10000000-0000-0000-0000-000000000003', 'secret-draft', 'Чернова', 'draft', now() + interval '10 days', 0, null);

insert into public.event_private_details (event_id, online_url)
values ('10000000-0000-0000-0000-000000000001', 'https://meet.example.org/abc');

insert into public.specialists (id, user_id, slug, full_name) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000d', 'siya', 'Сия Специалист');
insert into public.consultation_types (id, slug, name, duration_minutes, buffer_minutes, price_cents, requires_prepayment, allow_bank_transfer) values
  ('30000000-0000-0000-0000-000000000001', 'intro', 'Първа среща', 60, 15, 0, false, false),
  ('30000000-0000-0000-0000-000000000002', 'paid', 'Платена консултация', 60, 0, 4000, true, true);
insert into public.specialist_consultation_types (specialist_id, consultation_type_id) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002');
insert into public.specialist_availability (specialist_id, weekday, start_time, end_time)
select '20000000-0000-0000-0000-000000000001', d, '09:00', '17:00' from generate_series(1, 7) d;

insert into public.membership_plans (id, slug, name, price_cents) values
  ('40000000-0000-0000-0000-000000000001', 'viber', 'Затворена Viber общност', 2100);
insert into public.viber_groups (id, slug, name) values
  ('50000000-0000-0000-0000-000000000001', 'main', 'Основна група');
insert into public.viber_group_invites (viber_group_id, invite_link)
values ('50000000-0000-0000-0000-000000000001', 'https://invite.viber.com/secret');
insert into public.plan_viber_groups values
  ('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001');

-- A slot three days ahead at 10:00 Sofia time.
create table checks.slot as
select ((current_date + 3) + time '10:00') at time zone 'Europe/Sofia' as s;
grant select on checks.slot to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Visitors (anon)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select checks.ok(not exists (select 1 from public.events where status <> 'published'), 'anon sees published events only');
select checks.ok((select count(*) = 2 from public.events where slug in ('free-talk', 'paid-workshop', 'secret-draft')),
                 'anon sees the published fixtures');
select checks.ok((select count(*) = 2 from public.event_listing where slug in ('free-talk', 'paid-workshop', 'secret-draft')),
                 'anon event listing hides drafts');
select checks.ok((select seats_left = 1 from public.event_listing where slug = 'paid-workshop'), 'listing shows seats left');
select checks.expect_error('select * from public.profiles', 'permission denied');
select checks.ok((select count(*) = 0 from public.event_private_details), 'anon cannot read private event details');
select checks.ok((select count(*) > 0 from public.get_available_slots(
  '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', current_date, current_date + 7)),
  'anon can browse free consultation slots');
select checks.expect_error($$select public.register_for_event('10000000-0000-0000-0000-000000000001')$$, 'permission denied');
select checks.expect_error($$insert into public.faqs (question, answer) values ('q', 'a')$$, 'permission denied');

reset role;

-- ---------------------------------------------------------------------------
-- Alice: profile isolation and protected columns
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select checks.ok((select count(*) = 1 from public.profiles), 'alice sees only her own profile');
update public.profiles set phone = '+359888123456' where id = '00000000-0000-0000-0000-00000000000c';
select checks.ok((select phone is null from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'update of another profile does not touch alice');
select checks.expect_error($$update public.profiles set status = 'suspended' where id = auth.uid()$$, 'profile_field_protected');
update public.profiles set first_name = 'Алиса-Мария' where id = auth.uid();
select checks.expect_error($$insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')$$, 'row-level security');
select checks.ok(not public.is_admin(), 'alice is not admin');
select checks.expect_error($$insert into public.event_registrations (event_id, user_id, status, price_cents)
  values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'confirmed', 0)$$, 'row-level security');
select checks.expect_error($$select public.mark_payment_succeeded(gen_random_uuid(), 100)$$, 'permission denied');
select checks.expect_error($$select public.confirm_bank_transfer(gen_random_uuid())$$, 'forbidden');

-- Free event: confirmed at once, no payment; duplicates refused; private details unlocked.
select checks.ok((select status = 'confirmed' and payment_id is null
                    from public.register_for_event('10000000-0000-0000-0000-000000000001')), 'free registration confirmed');
select checks.expect_error($$select public.register_for_event('10000000-0000-0000-0000-000000000001')$$, 'already_registered');
select checks.ok((select online_url is not null from public.event_private_details), 'attendee sees online link');
select checks.expect_error($$select public.register_for_event('10000000-0000-0000-0000-000000000003')$$, 'event_not_found');

-- Paid event with one seat: alice holds it while paying.
create temp table alice_reg on commit drop as
select * from public.register_for_event('10000000-0000-0000-0000-000000000002');
grant select on alice_reg to public;
select checks.ok((select status = 'pending_payment' and amount_cents = 2500 from alice_reg), 'paid registration waits for payment');
select checks.ok((select r.registration_id = x.registration_id
                    from alice_reg r, public.register_for_event('10000000-0000-0000-0000-000000000002') x),
  'repeat call resumes the same checkout');

reset role;

-- ---------------------------------------------------------------------------
-- Bob: capacity and isolation
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select checks.expect_error($$select public.register_for_event('10000000-0000-0000-0000-000000000002')$$, 'event_full');
select checks.ok((select count(*) = 0 from public.event_registrations), 'bob cannot see alice registrations');
select checks.ok((select count(*) = 0 from public.payments), 'bob cannot see alice payments');
select checks.ok((select count(*) = 0 from public.event_private_details), 'non-attendee cannot see online link');

reset role;

-- Alice's checkout hold runs out; the seat frees up for Bob, who pays by bank transfer.
update public.event_registrations set hold_expires_at = now() - interval '1 minute'
 where id = (select registration_id from alice_reg);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
create temp table bob_reg on commit drop as
select * from public.register_for_event('10000000-0000-0000-0000-000000000002', 'bank_transfer');
grant select on bob_reg to public;
select checks.ok((select status = 'pending_payment' and bank_reference like 'NSJS-%' from bob_reg),
  'expired hold released the seat; bank transfer gets a reference');
reset role;

-- Alice's late Stripe payment arrives after the seat went to Bob: money is kept and flagged.
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select checks.ok((select status = 'succeeded' and needs_review
                    from public.mark_payment_succeeded((select payment_id from alice_reg), 2500, 'pi_test_1')),
  'late payment for a lost seat is flagged for review');
select checks.ok((select status = 'succeeded'
                    from public.mark_payment_succeeded((select payment_id from alice_reg), 2500, 'pi_test_1')),
  'repeated webhook is idempotent');
select checks.expect_error($$select public.mark_payment_succeeded((select payment_id from bob_reg), 1)$$, 'amount_mismatch');
reset role;

-- Admin confirms Bob's transfer.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select public.confirm_bank_transfer((select payment_id from bob_reg), 'Получено по сметка');
select checks.ok((select status = 'confirmed' from public.event_registrations
                   where id = (select registration_id from bob_reg)), 'admin confirmation confirms registration');
select checks.ok((select count(*) >= 3 from public.event_registrations), 'admin sees all registrations');
select checks.ok((select count(*) = 4 from public.profiles where email like '%@example.org'), 'admin sees all profiles');
reset role;

-- ---------------------------------------------------------------------------
-- Consultations: real slot booking with conflict prevention
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

create temp table alice_booking on commit drop as
select * from public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', (select s from checks.slot));
grant select on alice_booking to public;
select checks.ok((select status = 'confirmed' and payment_id is null from alice_booking), 'free consultation confirmed');
select checks.ok(not exists (select 1 from public.get_available_slots('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', current_date + 3, current_date + 3)
  where starts_at in ((select s from checks.slot), (select s + interval '1 hour' from checks.slot))),
  'booked slot and its buffer disappear from availability');
select checks.expect_error($$select public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', (select s + interval '7 minutes' from checks.slot))$$, 'slot_unavailable');
select checks.expect_error($$select public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', now() + interval '1 hour')$$, 'slot_unavailable');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select checks.expect_error($$select public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', (select s from checks.slot))$$, 'slot_unavailable');
select checks.expect_error($$select public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', (select s + interval '30 minutes' from checks.slot))$$, 'slot_unavailable');
select checks.ok((select count(*) = 0 from public.consultation_bookings), 'bob cannot see alice booking');
create temp table bob_booking on commit drop as
select * from public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000002', (select s + interval '2 hours' from checks.slot), 'bank_transfer');
grant select on bob_booking to public;
select checks.ok((select status = 'pending_payment' and amount_cents = 4000 from bob_booking), 'prepaid consultation waits for payment');
reset role;

-- Even a direct insert by the owner cannot double-book: the exclusion constraint holds.
select checks.expect_error($$insert into public.consultation_bookings
  (user_id, specialist_id, consultation_type_id, starts_at, ends_at, blocked_until, status, price_cents)
  values ('00000000-0000-0000-0000-00000000000c', '20000000-0000-0000-0000-000000000001',
          '30000000-0000-0000-0000-000000000001', (select s from checks.slot),
          (select s + interval '1 hour' from checks.slot), (select s + interval '1 hour' from checks.slot),
          'confirmed', 0)$$, 'consultation_bookings_no_overlap');

-- The specialist sees her own bookings and those clients only.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';
select checks.ok((select count(*) = 2 from public.consultation_bookings), 'specialist sees her bookings');
select checks.ok((select count(*) = 3 from public.profiles), 'specialist sees herself and her two clients');
select checks.ok((select count(*) = 0 from public.payments), 'specialist cannot see payments');
insert into public.specialist_time_off (specialist_id, starts_at, ends_at)
values ('20000000-0000-0000-0000-000000000001', (select s + interval '1 day' from checks.slot),
        (select s + interval '1 day 8 hours' from checks.slot));
select checks.expect_error($$insert into public.specialist_availability (specialist_id, weekday, start_time, end_time)
  values (gen_random_uuid(), 1, '09:00', '10:00')$$, 'row-level security');
reset role;

-- Alice reschedules, then cancels; the original slot becomes free for Bob.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select checks.expect_error($$select public.reschedule_consultation((select booking_id from alice_booking),
  (select s + interval '1 day' from checks.slot))$$, 'slot_unavailable'); -- specialist time off
select checks.ok((select reschedule_count = 1 from public.reschedule_consultation((select booking_id from alice_booking),
  (select s + interval '30 minutes' from checks.slot))), 'reschedule into an overlapping-but-own slot works');
select checks.ok((select status = 'cancelled' from public.cancel_consultation((select booking_id from alice_booking))),
  'alice cancels before the deadline');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select checks.ok((select status = 'confirmed' from public.book_consultation('20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001', (select s from checks.slot))), 'released slot can be booked again');
reset role;

-- ---------------------------------------------------------------------------
-- Subscriptions by bank transfer and Viber access
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
create temp table alice_sub on commit drop as
select * from public.start_bank_transfer_subscription('40000000-0000-0000-0000-000000000001');
grant select on alice_sub to public;
select checks.ok((select amount_cents = 2100 from alice_sub), 'bank-transfer subscription requested');
select checks.ok((select count(*) = 0 from public.my_viber_groups()), 'no Viber access before payment');
select checks.ok((select count(*) = 0 from public.viber_group_invites), 'invite link hidden before payment');
select checks.expect_error($$select public.request_viber_access('50000000-0000-0000-0000-000000000001')$$, 'not_eligible');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select public.confirm_bank_transfer((select payment_id from alice_sub));
select checks.ok((select status = 'active' and current_period_end > now() + interval '27 days'
                    from public.subscriptions where id = (select subscription_id from alice_sub)),
  'admin confirmation activates one month');
select checks.ok((select count(*) = 1 from public.viber_access_actions where action = 'invite'),
  'admin to-do list asks to invite alice');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select checks.ok((select invite_link is not null from public.my_viber_groups()), 'paying member sees invite link');
select checks.ok((select count(*) = 1 from public.viber_group_invites), 'paying member can read invite row');
select public.request_viber_access('50000000-0000-0000-0000-000000000001', '+359888000111');
select checks.expect_error($$select public.start_bank_transfer_subscription('40000000-0000-0000-0000-000000000001')$$,
  'renewal_not_due_yet');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select checks.ok((select count(*) = 0 from public.viber_group_invites), 'non-member cannot read invite link');
select checks.ok((select count(*) = 0 from public.subscriptions), 'bob cannot see alice subscription');
reset role;

-- The paid month ends without a renewal transfer: access stops (no extra grace for bank transfer).
update public.subscriptions set current_period_start = now() - interval '31 days', current_period_end = now() - interval '1 minute'
 where id = (select subscription_id from alice_sub);
update public.viber_memberships set status = 'joined';
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select checks.ok((select (public.run_maintenance() ->> 'expired_subscriptions')::int = 1), 'maintenance expires the lapsed month');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select checks.ok((select count(*) = 0 from public.my_viber_groups()), 'access gone after the paid month');
reset role;
select checks.ok((select count(*) = 1 from public.viber_access_actions where action = 'remove'),
  'admin to-do list asks to remove alice');

-- ---------------------------------------------------------------------------
-- Admin safety and audit trail
-- ---------------------------------------------------------------------------
select checks.expect_error($$delete from public.user_roles where role = 'admin'$$, 'last_admin');
select checks.ok((select count(*) > 0 from public.audit_log where table_name = 'payments'), 'payment changes audited');
select checks.ok((select count(*) > 0 from public.audit_log where table_name = 'user_roles'), 'role grants audited');

select 'ALL DATABASE CHECKS PASSED' as result;
rollback;
