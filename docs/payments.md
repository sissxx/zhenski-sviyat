# Card payments (Stripe)

Card payments use Stripe Checkout (Stripe's own hosted payment page) for paid events, prepaid consultations
and monthly plans. Bank transfer stays available next to it wherever the event, service or plan allows it
(see docs/database.md for that flow). Everything runs in Stripe **test mode** for now.

## How it works

**Events and consultations.** The user picks "Карта" on the sign-up or booking form.
`register_for_event` / `book_consultation` hold the seat or slot for `checkout_hold_minutes` (30) and create a
pending payment with the server-side price. The server then creates a Checkout Session for exactly that amount
(`src/lib/stripe/checkout.ts`, `startPaymentCheckout`) with `client_reference_id = payment id`, stores the
session id on the payment, and redirects to Stripe.

- Paid: Stripe sends the user to the confirmation page with `session_id`. That page asks Stripe for the session
  and records it at once (`syncReturnedCheckout`), and the webhook records it too. Both call
  `mark_payment_succeeded`, which ignores repeats. The redirect alone never confirms anything.
- Cancelled on the Stripe page: back to the confirmation page with `plashtane=prekasnato`. The hold stays until
  it runs out, and "Плати с карта" reopens the same Checkout page.
- Never paid: the session expires with the hold; `checkout.session.expired` calls `mark_payment_failed`
  (`expired`) and the seat or slot is released.
- The user cancels the registration or booking: its open Checkout page is expired too.
- Paid after the hold ran out and the seat is gone: the payment is recorded and flagged for review, as before.
- Only cards (including Apple Pay / Google Pay) are offered, because they settle at once.

**Monthly plans.** "Моите абонаменти" (`/profil/abonamenti`) lists the active plans from the admin panel with
"Плати с карта" and "Банков превод". Card opens Checkout in subscription mode. The plan's Stripe Product and
Price are created automatically the first time someone subscribes (`ensurePlanPrice`), and a new Price is
created when an admin changes the plan's price; existing subscribers keep their old price. The member can stop
the subscription at the end of the paid month, or undo that, from the same page. Choosing card while a bank
transfer request for the same plan is still unpaid cancels that request.

Stripe renews the subscription every month. Webhooks keep `subscriptions` in step
(`sync_stripe_subscription`, always re-reading the subscription from Stripe so out-of-order events can't roll it
back) and add a payment row per invoice (`record_stripe_invoice`). When a renewal fails Stripe retries, and
access continues for `subscription_past_due_grace_days`. Viber access follows the subscription automatically.

**Refunds.** Refund in the Stripe dashboard. `charge.refunded` records it on the matching event or
consultation payment (`record_refund`). Refunds of subscription invoices are recorded by hand in the admin panel.

## Webhook

`POST /api/stripe/webhook` (`src/app/api/stripe/webhook/route.ts`):

1. Verifies the `Stripe-Signature` header with `STRIPE_WEBHOOK_SECRET` against the raw body. Bad signature: 400.
2. Stores the event in `stripe_webhook_events` once (`on conflict do nothing`).
3. Skips it if it was already processed; otherwise applies it (`src/lib/stripe/webhook.ts`).
4. Sets `processed_at` on success. On failure it saves `attempts` / `last_error` and answers 500, so Stripe
   retries (for up to 3 days); a retried event is processed again, which is safe because every step is
   idempotent.

Events to send: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`, `customer.subscription.created`,
`customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`,
`charge.refunded`.

Emails (docs/emails.md): a card payment for an event or consultation, and every paid plan invoice, sends
"payment confirmed" (`notifyPaymentConfirmed`) once it is stored. It runs after the response, and its dedupe key
stops a second copy when both the webhook and the return page record the same payment. Sign-up by card sends
no bank-transfer email, since those only go out for pending bank-transfer payments. There is no email yet for
an expired checkout or a failed renewal.

## Setup (test mode)

1. Vercel → Project → Settings → Environment Variables, marked Sensitive:
   `STRIPE_SECRET_KEY` (test secret key `sk_test_...`), `STRIPE_WEBHOOK_SECRET` (after step 2) and
   `SUPABASE_SECRET_KEY` if it isn't there yet. Redeploy.
2. Stripe dashboard (test mode) → Developers → Webhooks → Add endpoint:
   `https://zhenski-sviyat.vercel.app/api/stripe/webhook`, with the events above. Copy its signing secret.
3. Vercel Authentication (deployment protection) blocks Stripe from reaching the site. Either turn protection
   off for production, or create a "Protection Bypass for Automation" secret and add
   `?x-vercel-protection-bypass=<secret>` to the endpoint URL.
4. Test with card `4242 4242 4242 4242`, any future date, any CVC. `4000 0000 0000 9995` is declined;
   `4000 0025 0000 3155` asks for 3-D Secure.

Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a `whsec_` for `.env.local`.

## Before going live

- Live keys are ignored unless `STRIPE_ALLOW_LIVE=true`.
- Activate the Stripe account (organisation details, bank account), create a live webhook endpoint on the real
  domain and put the live keys in Vercel's Production environment only.
- Plans get new live Products and Prices automatically, but `membership_plans.stripe_product_id` and
  `stripe_price_id` hold the test ids: clear both columns when switching.
- Vercel Hobby is non-commercial; taking payments needs the Pro plan.
