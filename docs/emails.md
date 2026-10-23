# Transactional emails (Brevo)

All emails are Bulgarian, one column, readable on phones. Two kinds:

1. **Account emails** (confirm sign-up, reset password, change email) are sent by **Supabase Auth**. They go
   through Brevo once Supabase's SMTP settings point at Brevo, and use the templates in `supabase/templates/`.
2. **Site emails** (events, payments, consultations, reminders) are sent by the app through the **Brevo API**.

## Site emails

| When | To | Template key |
| --- | --- | --- |
| Free event sign-up | participant | `event_registration_confirmed` (includes the online link / attendee notes) |
| Paid event sign-up (bank transfer) | participant | `event_registration_bank_transfer` (amount, `NSJS-…` reference, IBAN, deadline) |
| Membership started or renewed by bank transfer | member | `subscription_bank_transfer` (amount, reference, IBAN, deadline) |
| Admin confirms a bank transfer, or Stripe reports a card payment or paid plan invoice | payer | `payment_confirmed` (event, consultation or membership) |
| Consultation booked | client | `consultation_booked`, or `consultation_bank_transfer` when prepaid by transfer |
| Consultation booked | specialist | `consultation_booked_specialist` |
| Consultation cancelled (by client, specialist or admin) | client, and the specialist unless they cancelled it | `consultation_cancelled`, `consultation_cancelled_specialist` |
| Consultation moved by the client | client and specialist | `consultation_rescheduled`, `consultation_rescheduled_specialist` |
| **Reminder**, 24 h before a confirmed consultation | client | `consultation_reminder` |
| **Reminder**, 24 h before an event | everyone with a confirmed place | `event_reminder` (includes the online link / attendee notes) |
| **Reminder**, 5 days before a bank-transfer membership month ends | member | `subscription_renewal_reminder` ("renew" link, or the transfer details again if the renewal was started but not paid) |

Specialists get mail at `specialist_private.notification_email`, or their login email when that is empty. A specialist
without either gets no notices.

### Code

- `src/lib/email/layout.ts`: the HTML + plain-text layout (brand green, Lora/Inter with safe fallbacks).
- `src/lib/email/templates.ts`: the Bulgarian texts. Change wording here.
- `src/lib/email/send.ts`: **`sendEmail()`**, the one helper every flow uses. It renders, sends through Brevo and
  writes `email_log`. A `dedupeKey` makes it idempotent (the column is unique); a failed send clears its key so it
  can be retried. It never throws.
- `src/lib/email/notifications.ts`: one function per event (`notifyEventRegistration`, `notifyPaymentConfirmed`,
  `notifyConsultationBooked`, `notifyConsultationCancelled`, `notifyConsultationRescheduled`). Each takes an id and
  loads the data with the service key. Server actions call them through `notifyLater()`, which runs after the
  response (Next.js `after()`), so a slow or failed email never blocks or undoes the action.

Card payments call `notifyLater(() => notifyPaymentConfirmed(paymentId))` once the payment is `succeeded`
(src/lib/stripe/checkout.ts and webhook.ts, see docs/payments.md); the same email covers both payment methods.

## Reminders

Migration `20261023120000_reminders.sql`. How it works:

1. `due_reminders()` (database) lists the reminders due now: confirmed consultations and event places starting
   within the reminder window, and active bank-transfer memberships whose paid month ends within the window. Anything
   already in `email_log` under the same `dedupe_key` is left out, so each reminder goes **once**. The key includes the
   start time (or period end), so a moved consultation or event, or the next month, gets its own reminder.
2. A pg_cron job `send-reminders` runs `request_reminder_run()` at minute 5 of **every hour**. It makes an HTTP POST
   (pg_net) to the site's `/api/cron/reminders` with `Authorization: Bearer <CRON_SECRET>`. Vercel Hobby crons run only
   once a day, so the database is the clock here, as for `run_maintenance()`.
3. The route (`src/app/api/cron/reminders/route.ts` → `src/lib/email/reminders.ts`) sends each due reminder through
   `sendEmail()`, at most 100 per run (Brevo's free plan allows 300 a day).

Rules:

- **Timing is set in Admin → Настройки → "Напомняния по имейл"**: hours before a consultation (default 24), hours
  before an event (24), days before a bank-transfer month ends (5). `0` switches a reminder off. The membership
  reminder never goes earlier than renewal opens (`subscription_renewal_window_days`, default 14).
- Something booked or confirmed **inside** the window gets no reminder (its confirmation email is recent).
- No reminders for pending (unpaid) bookings, cancelled places, suspended accounts, card memberships (Stripe renews
  them) or memberships set to end at the period end.
- Without Brevo settings the run does nothing (rather than logging a `skipped` row every hour).

### Switching reminders on (once, after the migration is applied)

1. Make a long random secret, e.g. `openssl rand -hex 32`.
2. Vercel → Settings → Environment Variables: add `CRON_SECRET` = that secret (Production, sensitive), then redeploy.
3. Supabase → SQL Editor (or Project Settings → Vault), store the same secret and the endpoint address:

   ```sql
   select vault.create_secret('<the secret>', 'cron_secret');
   select vault.create_secret('https://zhenski-sviyat.vercel.app/api/cron/reminders', 'reminders_url');
   ```

   When the domain changes, update `reminders_url` (`vault.update_secret`). Until both secrets exist the hourly job
   does nothing.

Check it: `select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'send-reminders')
order by start_time desc limit 5;` (the job), `select * from net._http_response order by created desc limit 5;` (the
site's answer, e.g. `{"status":"done","due":2,...}`) and `email_log` rows with template keys ending in `_reminder`.

### Settings (Vercel → Settings → Environment Variables)

| Name | Value | Notes |
| --- | --- | --- |
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys → Generate | **Sensitive.** Never commit or paste it in chat. |
| `EMAIL_FROM_ADDRESS` | a verified Brevo sender | see "Sender address" below |
| `EMAIL_FROM_NAME` | `Сдружение Женски свят` | optional, this is the default |
| `EMAIL_REPLY_TO` | where replies should go | optional |
| `SUPABASE_SECRET_KEY` | already set for Production | needed to read the data and write `email_log`; add it to Preview too to send from previews |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain>` once there is one | links in emails; without it Vercel's production URL is used |
| `CRON_SECRET` | a long random string | **Sensitive.** Protects `/api/cron/reminders`; the same value goes in Supabase Vault as `cron_secret` (see Reminders) |

Without `BREVO_API_KEY` or `EMAIL_FROM_ADDRESS` nothing is sent; each email is logged as `skipped`.
Check what was sent in Supabase: `select * from email_log order by created_at desc;`.

## Account emails (Supabase Auth)

### 1. SMTP: Supabase → Authentication → Emails → SMTP Settings → Enable custom SMTP

| Field | Value |
| --- | --- |
| Sender email | the same verified Brevo sender as `EMAIL_FROM_ADDRESS` |
| Sender name | `Сдружение Женски свят` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | the SMTP login shown in Brevo → SMTP & API → SMTP (ends in `@smtp-brevo.com`) |
| Password | an **SMTP key** from the same page (not the API key) |

Then raise Authentication → Rate Limits → "emails per hour" (the built-in mailer allowed only a few).

### 2. Templates: Supabase → Authentication → Emails → Templates

Paste the HTML of each file into the matching template and set the subject:

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirm signup | `supabase/templates/confirmation.html` | Потвърди имейла си |
| Reset Password | `supabase/templates/recovery.html` | Нова парола |
| Change Email Address | `supabase/templates/email_change.html` | Потвърди новия си имейл |

The links go to `{{ .SiteURL }}/auth/confirm?token_hash=…`, so they work on any device (not only the browser that
signed up). This needs the Site URL and redirect URLs from `docs/auth.md`. Rebuild the files after changing the layout
or texts with `npm run email:auth-templates`.

## Sender address and limits

- Brevo's free plan sends **300 emails a day** (site and account emails together).
- The only verified sender today is a Gmail address. Gmail addresses can't be authenticated (SPF/DKIM/DMARC) by
  Brevo, so mail "from" Gmail sent through Brevo is likely to land in spam or be rejected, and Brevo may rewrite the
  sender. Fine for testing; for launch, add the `.org` domain in Brevo (Senders, Domains & Dedicated IPs → Domains),
  publish the DNS records it shows in Cloudflare, and use e.g. `info@<domain>` as `EMAIL_FROM_ADDRESS` and the
  Supabase sender.
