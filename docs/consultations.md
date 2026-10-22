# Consultations on the public site

Services, specialists and free times come from Supabase (see `docs/database.md`). The admin manages them in
`/admin/vidove-konsultatsii` and `/admin/spetsialisti` (services offered, own price, weekly hours, time off) and the
rules in `/admin/nastroyki`. Pages render per request.

| Page | Path | Notes |
| --- | --- | --- |
| Booking | `/konsultatsii` | service → specialist (or "без предпочитание") → day and time → confirm; `?usluga=<slug>&spetsialist=<slug>` preselects |
| Confirmation | `/konsultatsii/potvarzhdenie?zapis=<id>` | outcome, bank transfer details while unpaid |
| My consultations | `/profil/konsultatsii` | upcoming and past bookings, payment status, cancel, move |
| Move | `/profil/konsultatsii/<id>/premesti` | new time with the same specialist and service |
| Specialist schedule | `/profil/spetsialist` | for accounts linked to a specialist: own bookings with client contacts, cancel, mark held / no-show, own weekly hours and time off |

- Code: `src/lib/consultations/queries.ts` (reads, free slots, what the user may still do),
  `src/lib/consultations/actions.ts` (slots for the picker, booking, cancel and move via `book_consultation`,
  `cancel_consultation`, `reschedule_consultation`), `src/lib/consultations/types.ts` (page model, payment mode, labels).
- Only services with at least one active specialist are listed. With no services the page asks people to get in touch.
- Free times come from `get_available_slots` per specialist over the whole booking window
  (`consultation_max_advance_days`, in 60-day calls). With "без предпочитание", a time shared by several specialists
  goes to the first one in sort order. Visitors can browse times; booking needs a login.
- The database re-checks every booking (working hours, time off, notice, overlaps for the specialist and for the
  user). If the time was taken meanwhile, the form shows the error and reloads the free times.
- Payment depends on the service and the specialist's price: free, paid on site (`requires_prepayment` off),
  prepaid by **card or bank transfer** (`allow_bank_transfer` on), or prepaid by card only. Card goes through Stripe
  Checkout (docs/payments.md); until the Stripe keys are set it shows "скоро", and card-only services show a contact
  link. Bank transfers hold the time as `pending_payment` until an admin confirms the payment, or until the
  hold ends (`bank_transfer_hold_days`, at the latest 2 hours before the session).
- Users can cancel an unpaid booking any time and a confirmed one until `consultation_cancel_deadline_hours` before
  the start; they can move a confirmed one within the same deadline, up to `consultation_max_reschedules` times. A
  cancelled paid booking goes to "Плащания → За преглед" for a refund decision.
- When moving, times that overlap the current booking (other than its own start) aren't offered, because
  `get_available_slots` still counts the current booking as taken.
- Confirmation and reminder emails (Brevo) aren't sent yet, so the pages don't promise one.
- Consultation types have no online/in-person field; the service's "location info" text says where it happens.

## Specialists

- The admin links a specialist profile to a site account in `/admin/spetsialisti/<id>` ("Профил за вход (имейл)").
  The account must exist first. Linking sets `specialists.user_id` and adds the `specialist` role.
- A linked account sees "Моят график" in Моят профил (`src/lib/specialist/`). It lists the specialist's bookings from
  the last 30 days onward with the clients' names, emails and phones, and lets them cancel (no deadline for staff;
  the reason is stored), mark past ones as held or no-show, and add or remove their own weekly hours and time off
  (Sisi's decision, 2026-10-22). Profile, services and prices stay admin-only.
- RLS limits all of this to the specialist's own rows; payments stay admin-only.
