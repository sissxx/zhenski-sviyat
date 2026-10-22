-- Row Level Security (spec 12.2, 15.1, 15.2).
--
-- Roles:
--   anon           visitors: published content only
--   authenticated  signed-in users: their own rows; admins and specialists get more via helper functions
--   service_role   trusted server code (webhooks, cron, contact form): bypasses RLS
--
-- Writes to registrations, bookings, payments and subscriptions happen only through the
-- functions in the previous migration, so there are deliberately no INSERT policies for users.

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere and tighten table privileges
-- ---------------------------------------------------------------------------

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end;
$$;

-- TRUNCATE ignores RLS, so clients must never hold it. Visitors only ever read.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;

-- Internal tables nobody but the server and admins should even query.
revoke all on public.stripe_webhook_events, public.stripe_customers, public.audit_log,
              public.email_log, public.contact_messages
  from anon;

-- ---------------------------------------------------------------------------
-- Settings and accounts
-- ---------------------------------------------------------------------------

create policy "settings readable by everyone" on public.app_settings
  for select to anon, authenticated using (true);
create policy "settings editable by admins" on public.app_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "own profile, admins, and specialists for their clients" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or public.is_client_of_my_specialist(id)
  );
create policy "own profile or admin can update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "own roles or admin" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admins grant roles" on public.user_roles
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins revoke roles" on public.user_roles
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Website content: public reads published rows, admins manage everything
-- ---------------------------------------------------------------------------

create policy "published blocks are public" on public.content_blocks
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "published team members are public" on public.team_members
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "published faqs are public" on public.faqs
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "published partners are public" on public.partners
  for select to anon, authenticated using (is_published or (select public.is_admin()));
create policy "current announcements are public" on public.announcements
  for select to anon, authenticated
  using (
    (is_published and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_admin())
  );
create policy "published promotions are public" on public.promotions
  for select to anon, authenticated
  using ((is_published and (valid_until is null or valid_until > now())) or (select public.is_admin()));

create policy "admins read contact messages" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
create policy "admins handle contact messages" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------

create policy "non-draft events are public" on public.events
  for select to anon, authenticated using (status <> 'draft' or (select public.is_admin()));

create policy "attendees see private event details" on public.event_private_details
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.event_registrations r
                where r.event_id = event_private_details.event_id
                  and r.user_id = (select auth.uid())
                  and r.status = 'confirmed')
  );

create policy "own registrations or admin" on public.event_registrations
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Consultations
-- ---------------------------------------------------------------------------

create policy "active specialists are public" on public.specialists
  for select to anon, authenticated
  using (is_active or user_id = (select auth.uid()) or (select public.is_admin()));

create policy "specialist private data: self or admin" on public.specialist_private
  for select to authenticated
  using (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()));
create policy "specialist updates own private data" on public.specialist_private
  for update to authenticated
  using (specialist_id = (select public.my_specialist_id()))
  with check (specialist_id = (select public.my_specialist_id()));

create policy "active consultation types are public" on public.consultation_types
  for select to anon, authenticated using (is_active or (select public.is_admin()));

create policy "specialist services are public" on public.specialist_consultation_types
  for select to anon, authenticated using (true);

-- Specialists manage their own schedule (spec 7.2: each specialist has their own availability).
create policy "schedule: specialist or admin read" on public.specialist_availability
  for select to authenticated
  using (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()));
create policy "schedule: specialist or admin write" on public.specialist_availability
  for all to authenticated
  using (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()))
  with check (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()));

create policy "time off: specialist or admin read" on public.specialist_time_off
  for select to authenticated
  using (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()));
create policy "time off: specialist or admin write" on public.specialist_time_off
  for all to authenticated
  using (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()))
  with check (specialist_id = (select public.my_specialist_id()) or (select public.is_admin()));

create policy "bookings: client, their specialist, or admin" on public.consultation_bookings
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or specialist_id = (select public.my_specialist_id())
    or (select public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Memberships and Viber
-- ---------------------------------------------------------------------------

create policy "active plans are public" on public.membership_plans
  for select to anon, authenticated using (is_active or (select public.is_admin()));

create policy "active viber groups are public" on public.viber_groups
  for select to anon, authenticated using (is_active or (select public.is_admin()));

create policy "plan to group mapping is public" on public.plan_viber_groups
  for select to anon, authenticated using (true);

create policy "invite links: eligible members or admin" on public.viber_group_invites
  for select to authenticated
  using (public.is_eligible_for_viber_group(viber_group_id) or (select public.is_admin()));

create policy "own subscriptions or admin" on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "own viber access or admin" on public.viber_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Payments and logs
-- ---------------------------------------------------------------------------

create policy "own payments or admin" on public.payments
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "admins read stripe customers" on public.stripe_customers
  for select to authenticated using ((select public.is_admin()));
create policy "admins read webhook events" on public.stripe_webhook_events
  for select to authenticated using ((select public.is_admin()));
create policy "admins read email log" on public.email_log
  for select to authenticated using ((select public.is_admin()));
create policy "admins read audit log" on public.audit_log
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Admin write access to managed tables (spec 12.1)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'content_blocks', 'team_members', 'faqs', 'partners', 'announcements', 'promotions',
    'events', 'event_private_details', 'event_registrations',
    'specialists', 'specialist_private', 'consultation_types', 'specialist_consultation_types',
    'consultation_bookings',
    'membership_plans', 'viber_groups', 'viber_group_invites', 'plan_viber_groups',
    'subscriptions', 'viber_memberships'
  ] loop
    execute format(
      'create policy "admins insert" on public.%1$I for insert to authenticated
         with check ((select public.is_admin()));
       create policy "admins update" on public.%1$I for update to authenticated
         using ((select public.is_admin())) with check ((select public.is_admin()));
       create policy "admins delete" on public.%1$I for delete to authenticated
         using ((select public.is_admin()));', t);
  end loop;
end;
$$;

-- payments have no direct write policy, even for admins: status changes must go through
-- confirm_bank_transfer / mark_payment_failed / record_refund so linked records stay consistent.
