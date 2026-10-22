-- Indexes for foreign keys the Supabase performance advisor flagged as uncovered.
-- They keep joins and ON DELETE checks on these columns from scanning whole tables.

create index consultation_bookings_type_idx on public.consultation_bookings (consultation_type_id);
create index consultation_bookings_cancelled_by_idx on public.consultation_bookings (cancelled_by);
create index contact_messages_user_idx on public.contact_messages (user_id);
create index contact_messages_handled_by_idx on public.contact_messages (handled_by);
create index content_blocks_updated_by_idx on public.content_blocks (updated_by);
create index email_log_user_idx on public.email_log (user_id);
create index event_registrations_cancelled_by_idx on public.event_registrations (cancelled_by);
create index events_created_by_idx on public.events (created_by);
create index payments_confirmed_by_idx on public.payments (confirmed_by);
create index plan_viber_groups_group_idx on public.plan_viber_groups (viber_group_id);
create index specialist_consultation_types_type_idx on public.specialist_consultation_types (consultation_type_id);
create index subscriptions_plan_idx on public.subscriptions (plan_id);
create index user_roles_granted_by_idx on public.user_roles (granted_by);
create index viber_memberships_group_idx on public.viber_memberships (viber_group_id);
