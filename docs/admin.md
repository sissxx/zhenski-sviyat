# Admin panel

Everything under `/admin` (Bulgarian UI). Only active admins get in: `requireAdminPage()` in
`src/lib/admin/session.ts` asks the database (`is_admin()`), sends visitors to login and shows other users the 404 page.
Every query and server action runs as the signed-in admin, so RLS and the database functions check each write again.
The service key is not used.

| Section | Path | What it does |
| --- | --- | --- |
| Табло | `/admin` | Counts of pending transfers, payments to review, Viber tasks; upcoming events and this week's consultations; "Обнови сега" runs `run_maintenance()` |
| Събития | `/admin/sabitiya` | Create and edit events (status, dates, venue, price, capacity, registration window, cancel deadline, bank transfer, cover image, attendee-only link and instructions) |
| Участнички | `/admin/sabitiya/<id>/uchastnichki` | Participant list with contacts and payment status, check-in, cancel a registration, CSV download |
| Консултации | `/admin/konsultatsii` | Upcoming and past bookings, by specialist; cancel, mark completed / no-show |
| Плащания | `/admin/plashtaniya` | Bank-transfer queue (confirm / reject), payments flagged for review, refunds, all payments |
| Абонаменти | `/admin/abonamenti` | Subscriptions by status; end a bank-transfer subscription |
| Viber достъп | `/admin/viber` | Who to invite or remove (`viber_access_actions`), groups with invite links |
| Потребители | `/admin/potrebiteli` | Search accounts; per user: their records, suspend / activate, admin role |
| Видове консултации, Специалисти | `/admin/vidove-konsultatsii`, `/admin/spetsialisti` | Services; specialist profiles, which services they offer (own price), weekly hours, time off, login account |
| Членство и планове | `/admin/chlenstvo` | Plans, prices, Stripe price id, which Viber groups each plan opens |
| Съдържание | `/admin/vaprosi`, `partnyori`, `promotsii`, `ekip`, `obyavi` | FAQs, partners, promotions, founders/team, announcements |
| Настройки | `/admin/nastroyki` | `app_settings`: consultation rules, cancel deadlines, holds, renewal window, bank account |

## Code

- `src/lib/admin/forms.ts`: fields and Zod schema of every editor (checked in the browser and again in the action).
- `src/lib/admin/entities.ts`: how form values become rows (euros → cents, Sofia time → UTC) and the extra tables
  some editors write.
- `src/lib/admin/actions.ts`: all server actions. Payment changes go through the database functions
  (`confirm_bank_transfer`, `mark_payment_failed`, `record_refund`, `resolve_payment_review`).
- Images upload from the browser straight to the public `media` bucket (admins only, by storage policy).
- Things that have registrations, bookings or subscriptions can't be deleted; hide or cancel them instead.

## The first admin

Nobody is an admin until one row is added by hand. After Sisi signs up and confirms the email, run once in the
Supabase SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where lower(email) = lower('<sisi's email>');
```

From then on admins grant the role to others in Потребители. The last admin can't be removed.

## Database change

`20261022120000_admin_payment_review.sql` adds `resolve_payment_review(payment_id, note)`, which closes a payment
flagged for review without a refund. Until it is applied, that one button answers "Тази функция още не е добавена".
