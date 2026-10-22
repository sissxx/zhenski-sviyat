# Database

Supabase (Postgres) schema for the Women's World / NSJS platform. Everything is in
`supabase/migrations/`, applied in filename order. They are applied to the hosted Supabase project `zhenski-sviyat`
(ref `yxkwpzihfuekffbpsbts`, Frankfurt `eu-central-1`, Free plan); `seed.sql` is not, so that database starts empty.

| Migration | What it adds |
| --- | --- |
| `…100000_foundation` | enums, `app_settings`, `profiles`, `user_roles`, role helpers |
| `…100100_content` | page text, team/founders, FAQs, partners, announcements, promotions, contact messages |
| `…100200_events` | events, private event details, registrations, `event_listing` view |
| `…100300_consultations` | specialists, consultation types, weekly availability, time off, bookings |
| `…100400_memberships` | membership plans, Viber groups and invite links, subscriptions, Viber access tracking |
| `…100500_payments` | payments (Stripe and bank transfer), Stripe customers, webhook event log |
| `…100600_notifications_audit` | email log, audit log and audit triggers |
| `…100700_business_functions` | all write operations (register, book, pay, subscribe…) |
| `…100800_rls` | Row Level Security policies and table privileges |
| `…100900_storage` | public `media` bucket for images, admin-only uploads |
| `…101000_foreign_key_indexes` | indexes on foreign keys flagged by the Supabase performance advisor |

`supabase/seed.sql` holds development data only (the provisional €8 / €21 plans, two Viber groups).
`supabase/checks/database_checks.sql` checks RLS isolation, double-booking protection, payments and Viber access.

## Conventions

- Timestamps are `timestamptz` (UTC). The UI shows them in `Europe/Sofia`. Specialists' weekly hours are stored as local times.
- Money is integer euro cents (`price_cents`, `amount_cents`). Currency is always `EUR`.
- Column and table names are English. Everything users see is Bulgarian and lives in content columns.
- Business errors are raised as `P0001` with a stable message key. The frontend maps each key to a Bulgarian message:
  `not_authenticated`, `account_suspended`, `forbidden`, `event_not_found`, `registration_closed`,
  `registration_not_open_yet`, `already_registered`, `event_full`, `payment_method_not_allowed`,
  `registration_not_found`, `registration_not_active`, `cancellation_deadline_passed`, `slot_unavailable`,
  `too_late_for_bank_transfer`, `booking_not_found`, `booking_not_active`, `booking_not_finished`,
  `reschedule_limit_reached`, `plan_not_found`, `already_subscribed`, `renewal_not_due_yet`, `not_eligible`,
  `payment_not_found`, `payment_not_confirmable`, `payment_not_refundable`, `amount_mismatch`,
  `invalid_amount`, `invalid_status`, `profile_field_protected`, `last_admin`.

## Roles

| Role | How it is granted | Can |
| --- | --- | --- |
| Visitor (`anon`) | not signed in | read published content, events, plans, specialists, free consultation slots |
| User | every account | read and edit own profile; see own registrations, bookings, payments, subscriptions, Viber access; call the user functions |
| Specialist | row in `user_roles` + `specialists.user_id` set | everything a user can, plus own schedule and time off, own bookings, profiles of own clients only, mark outcomes |
| Admin | row in `user_roles` | read everything, manage content, events, consultations, plans, Viber groups, roles; confirm bank transfers |
| Server (`service_role`) | Stripe webhooks, cron, contact form | bypasses RLS; the only caller of the Stripe sync functions |

Roles live in `user_roles`, never in profile fields a user can edit. A suspended account loses its roles' powers
and cannot register or book. The last admin can't be removed.

The first admin is created by hand once:
`insert into user_roles (user_id, role) values ('<auth user id>', 'admin');` (SQL editor).

## Tables

**Accounts.** `profiles` (1:1 with `auth.users`, created by a trigger from sign-up metadata: `first_name`,
`last_name`, `phone`, `terms_accepted`, `privacy_accepted`, `marketing_consent`), `user_roles`.
Users can't change their own `status` or `email` (the email follows Supabase Auth).

**Content.** `content_blocks` (keyed page text such as `home.hero.title`), `team_members` (founders),
`faqs`, `partners`, `announcements`, `promotions`, `contact_messages`. Public reads published rows only.

**Events.** `events` (draft → published → completed/cancelled, price, capacity, registration window,
whether bank transfer is allowed, its own cancellation deadline), `event_private_details` (online link and
instructions, visible to confirmed attendees only), `event_registrations` (one live registration per user and
event, price snapshot, seat hold while unpaid). `event_listing` is a view with `seats_left`, `is_full`, `registration_open`.

**Consultations.** `specialists` (+ `specialist_private` for contact data), `consultation_types` (duration,
buffer after the session, price, prepayment, bank transfer allowed), `specialist_consultation_types`
(who offers what, optional own price), `specialist_availability` (weekly hours with optional validity dates),
`specialist_time_off`, `consultation_bookings`.

**Memberships.** `membership_plans` (price, Stripe price id, bank transfer allowed), `viber_groups`,
`viber_group_invites` (invite link, visible only to eligible members), `plan_viber_groups` (many-to-many:
a plan opens one or more groups), `subscriptions`, `viber_memberships` (admin-tracked invite/join/remove state).

**Payments.** `payments` (one row per charge: Stripe checkout, Stripe subscription invoice, or bank transfer;
links to the registration, booking or subscription it pays for; `bank_reference` like `NSJS-7K3Q9P2A` for the
transfer description; `needs_review` for cases an admin must decide), `stripe_customers`, `stripe_webhook_events`.

**Operations.** `email_log` (every Brevo email, with `dedupe_key` so reminders never go twice), `audit_log`
(who changed what on settings, roles, events, registrations, bookings, plans, Viber, subscriptions and payments;
for profiles only status changes are logged, to keep personal data out of the log).

## Key flows

**Free event.** `register_for_event(event_id)` locks the event, checks the window and capacity, and confirms
immediately. No payment, no checkout.

**Paid event.** `register_for_event(event_id, 'stripe' | 'bank_transfer')` creates a `pending_payment`
registration that holds the seat, plus a pending payment with the server-side price. It returns `payment_id`.
- Stripe: the server creates a Checkout Session with `client_reference_id = payment_id` and an expiry equal to
  the hold, stores the session id on the payment, and redirects. The webhook calls
  `mark_payment_succeeded(payment_id, amount_cents, payment_intent_id, session_id)` or
  `mark_payment_failed(payment_id, 'expired' | 'failed')`. The browser redirect proves nothing.
- Bank transfer: the user sees the IBAN from `app_settings` and the `bank_reference`. An admin checks the bank
  account and calls `confirm_bank_transfer(payment_id)`, or rejects it with `mark_payment_failed`.

Calling `register_for_event` again during an unfinished checkout returns the same registration and payment.
If money arrives after the hold expired and the seat is gone, the payment is still recorded and flagged
`needs_review` so an admin refunds it. The same happens when someone cancels a paid registration or booking.

**Consultation booking.** `get_available_slots(specialist, type, from, to)` builds slots from weekly hours,
minus time off, live bookings (plus buffer), the minimum notice and the booking window.
`book_consultation(...)` re-checks the slot on the server, and a Postgres exclusion constraint on
`(specialist_id, time range)` makes double booking impossible even for simultaneous requests (tested with
20 parallel requests for one slot: exactly one succeeded). Free or pay-on-site types are confirmed at once;
prepaid types follow the same payment flow as events. `cancel_consultation` and `reschedule_consultation`
enforce the deadline and reschedule limit for users. Specialists and admins can always cancel or move.
`set_booking_outcome` records completed / no-show.

**Subscriptions by card.** The server creates a Stripe Checkout Session in subscription mode with the plan's
`stripe_price_id`. Webhooks call `sync_stripe_subscription(...)` for subscription events and
`record_stripe_invoice(...)` for each invoice. Access continues while Stripe retries a failed renewal, for
`subscription_past_due_grace_days` (default 7).

**Subscriptions by bank transfer.** `start_bank_transfer_subscription(plan_id)` creates the subscription in
`pending_bank_transfer` with a pending payment. Each payment an admin confirms activates or extends the
subscription by one billing period (from the current end date when renewing early). Renewal opens
`subscription_renewal_window_days` (default 14) before the end. If no renewal is confirmed, access lasts until
the end of the month already paid and then stops. There is no extra grace, as Sisi decided.

**Viber access.** Access is computed, never stored as a flag: a user is eligible for a group when they have a
subscription that currently grants access on a plan linked to that group. `my_viber_groups()` returns eligible
groups with invite links. `request_viber_access(group, phone)` tells the admin which number to invite.
The `viber_access_actions` view is the admin's to-do list: `invite` for eligible members not yet in the group,
`remove` for members whose access ended. Admins update `viber_memberships` after acting in Viber, since
Viber membership can't be automated reliably (spec 9).

**Maintenance.** Call `run_maintenance()` every 5–15 minutes (Vercel cron route with the service key, or
`pg_cron`). It expires unpaid holds and payments, ends lapsed bank-transfer periods and unconfirmed sign-ups,
and marks past bookings and events completed. Holds are also cleaned up whenever someone books.

**Stripe webhooks.** Store each event first:
`insert into stripe_webhook_events (id, type, payload) values (...) on conflict (id) do nothing returning id`.
If nothing comes back, the event was already received, so skip it. Set `processed_at` when it succeeds, or
`attempts` / `last_error` when it fails.

## Row Level Security

RLS is on for every table (the checks script asserts this). In short:

- Visitors and users read only published content. Drafts, unpublished FAQs and inactive plans are admin-only.
- Users read only their own profile, registrations, bookings, payments, subscriptions and Viber rows.
- Users can't insert or update registrations, bookings, payments or subscriptions directly. All writes go
  through the functions above, which run as `security definer` with a fixed `search_path` and check the
  caller themselves. Execute rights are revoked by default and granted per function.
- Specialists see their own bookings and the profiles of their own clients only, and manage their own hours
  and time off. They can't see payments.
- Admins can manage all content and operational tables. Payments have no direct write policy, even for admins,
  so confirmations and refunds always go through functions that keep linked records consistent.
- `TRUNCATE` is revoked from client roles (it ignores RLS). Visitors have no write privileges at all.
- Policies call helper functions as `(select public.is_admin())` so Postgres evaluates them once per query.

The service-role key must stay on the server (Route Handlers, webhooks, cron). It is never sent to the browser.

## Configurable business rules (`app_settings`)

These rules aren't final yet. Admins can change them in the admin panel without a deploy.

| Setting | Default | Meaning |
| --- | --- | --- |
| `consultation_max_advance_days` | 60 | how far ahead people can book |
| `consultation_min_notice_hours` | 24 | earliest bookable slot from now |
| `consultation_cancel_deadline_hours` | 24 | users can cancel or reschedule until this long before |
| `consultation_max_reschedules` | 2 | reschedules allowed per booking (users only) |
| `consultation_slot_step_minutes` | 30 | spacing of start times in the calendar |
| per type: `requires_prepayment` | true | false = confirmed at once, paid on site |
| per type: `allow_bank_transfer` | false | bank transfer for consultations (holds end 2 h before the session) |
| `event_cancel_deadline_hours` | 48 | per event override: `events.cancellation_deadline_hours` |
| `checkout_hold_minutes` | 30 | how long a seat or slot is held during card checkout (Stripe minimum is 30) |
| `bank_transfer_hold_days` | 5 | how long a seat, slot or sign-up waits for a transfer |
| `subscriptions_allow_bank_transfer` | true | monthly plans can be paid by transfer (confirmed by Sisi) |
| `subscription_renewal_window_days` | 14 | how early a bank-transfer renewal can be started |
| `subscription_past_due_grace_days` | 7 | card renewals only |
| `bank_transfer_beneficiary`, `_iban`, `_bic`, `_bank_name` | empty | shown with transfer instructions |

## Assumptions and open points

- Consultation rules (booking window, cancel deadline, prepayment) aren't decided. The defaults above are placeholders.
- Refunds are decided by an admin. Cancelling something already paid flags the payment (`needs_review`), and
  `record_refund` records the refund after it is made in Stripe or by bank.
- No waitlists, coupons or automatic Viber sync in the MVP (spec 22). The schema leaves room to add them.
- Profile fields are minimal (name, phone, consents). Add more only once the client confirms them (open question 3).
- Retention: deleting an account removes the profile, registrations, bookings and subscriptions. Payments are
  kept with `user_id` cleared, for accounting. Retention periods for the audit and email logs still need to be set.
- Viber group invite links are treated as secrets and only shown to eligible members.

## Running locally

```bash
supabase init            # once, if supabase/config.toml does not exist yet
supabase start
supabase db reset        # applies migrations + seed.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 \
  -f supabase/checks/database_checks.sql   # prints ALL DATABASE CHECKS PASSED
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```
