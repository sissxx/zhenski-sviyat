# Events on the public site

Events come from Supabase (`event_listing` view, see `docs/database.md`). Pages render per request, so seats and
status are always current.

| Page | Path | Notes |
| --- | --- | --- |
| List | `/sabitiya` | upcoming published events (filter: всички / на живо / онлайн; hybrid counts as both), then past ones |
| Detail | `/sabitiya/<slug>` | status: open, full, not open yet, closed, past, cancelled; shows the user's own registration |
| Sign-up | `/sabitiya/<slug>/zapisvane` | signed-in users only; name, email and phone come from the profile |
| Confirmation | `/sabitiya/<slug>/potvarzhdenie?zapisvane=<id>` | outcome, bank transfer details, attendee link once confirmed |
| My events | `/profil/sabitiya` | upcoming and past registrations, payment status, cancel |

- Code: `src/lib/events/queries.ts` (reads), `src/lib/events/actions.ts` (sign-up and cancel via the
  `register_for_event` / `cancel_event_registration` functions), `src/lib/events/types.ts` (page model and labels).
- Database error keys map to Bulgarian in `src/lib/db-errors.ts` (shared with the admin panel).
- Free events are confirmed at once. A user can't sign up twice: the database allows one live registration per user
  and event, and a pending one is handed back instead of a duplicate.
- Paid events: **bank transfer only for now**. The registration holds the seat as `pending_payment` until an admin
  confirms the transfer (or the hold of `bank_transfer_hold_days` ends). The page shows the amount, the
  `NSJS-…` reference, the deadline and the bank account from `app_settings`; until an admin fills in the IBAN a
  placeholder is shown. Card payment (Stripe Checkout) is shown as "скоро"; paid events without bank transfer
  ask people to get in touch.
- Confirmation emails (Brevo) aren't sent yet, so the pages don't promise one.
- No category column: the Figma category filter was replaced by a format filter.
