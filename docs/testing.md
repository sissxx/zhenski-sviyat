# Tests

Four layers, all run by GitHub Actions (`.github/workflows/ci.yml`) on every pull request:

| Command | What | Needs |
| --- | --- | --- |
| `npm test` | Unit tests (Vitest, `tests/unit`): validation, prices, dates, emails, routes | nothing |
| `npm run test:e2e` | Smoke tests in a browser (Playwright, `tests/e2e`): every public page, forms, accessibility, mobile layout, with no services connected | `npm run build` |
| `npm run db:checks` | SQL checks (`supabase/checks/database_checks.sql`): RLS isolation, booking conflicts, payments, Viber access | local Supabase, freshly reset |
| `npm run test:db` | Database tests (Playwright, `tests/db`): the real pages and server actions against a local Supabase | local Supabase, `npm run test:db:build` |

## The test database

The database tests never use the live Supabase project. They run against a throwaway Supabase on the machine
(Docker), started from `supabase/config.toml`, which applies `supabase/migrations` and `supabase/seed.sql`.
`tests/db/env.ts` refuses any Supabase URL that isn't `127.0.0.1` or `localhost`. It takes the keys from
`TEST_SUPABASE_*` variables or, when those aren't set, from the running local Supabase (`supabase status`),
never from `.env.local`.

In CI the runner starts its own Supabase for each run and throws it away afterwards. Locally:

```bash
npm run db:start        # first time pulls the Docker images (a few minutes)
npm run db:checks       # on a fresh database; run `npm run db:reset` first if the browser tests ran
npm run test:db:build   # production build pointed at the local Supabase
npm run test:db
npm run db:stop
```

`test:db:build` writes `.next` with the local settings, so run `npm run build` again before `npm run test:e2e`.
Each test creates its own users, events, services and plans with unique names, so tests run in parallel and
can be repeated without a reset.

## What the database tests cover

- **Accounts** (`account.spec.ts`): sign-up creates the profile with consents, login and the return to the page
  asked for, wrong password, editing profile details, logout.
- **Events** (`events.spec.ts`): drafts hidden, sign-up from the event page via login, free sign-up and
  cancellation with the seat count, full events, paid sign-up by bank transfer with the transfer details, admin
  confirmation in Плащания, the online link shown only to confirmed attendees.
- **Consultations** (`consultations.spec.ts`): free times for visitors, booking a slot, the slot disappearing
  for others (and a direct double booking refused by the database), rescheduling and cancelling, a prepaid
  booking by bank transfer that the admin rejects.
- **Card payments** (`stripe-webhook.spec.ts`): the webhook refuses unsigned or forged requests; a completed
  Checkout confirms the payment and the seat, and a repeated delivery is ignored; an expired Checkout releases
  the seat; an old session can't cancel a newer one; refunds; members can't mark payments as paid.
- **Membership** (`membership.spec.ts`): plans from the database on Членство, a bank-transfer membership that the
  admin confirms, the Viber invite link appearing only then, the member's Viber number reaching the admin Viber
  page, no second membership for the same plan.
- **Search and share previews** (`seo.spec.ts`): event titles, share tags and Event JSON-LD, the tags in `<head>`
  for Facebook and Viber, the event share image, published events in the sitemap.
- **Admin panel** (`admin.spec.ts`): hidden from members and visitors (pages and the CSV export), every admin
  page opens, creating an event that then shows on the site (Sofia time, euro amounts), participants and CSV
  export, bank details in Настройки.

### Stripe in the tests

The server runs with a placeholder test key and webhook secret (`tests/db/env.ts`). The tests create card
payments the way the sign-up action does and post webhook events signed with that secret, exactly as Stripe
would send them, so nothing calls Stripe. Not covered: the redirect to Stripe Checkout itself and card
subscriptions (both need Stripe's API; check them by hand in test mode, see docs/payments.md).

### Emails

Emails go to a local stand-in for Brevo (`tests/db/fake-brevo.ts`, port 3299, started by `playwright.db.config.ts`
through `BREVO_API_URL`), so nothing is sent and the tests can read the subject and text of what would have gone out
(`GET http://127.0.0.1:3299/emails?to=<address>`). `tests/db/reminders.spec.ts` uses it to check the reminder emails.
