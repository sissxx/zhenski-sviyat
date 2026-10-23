# Membership and Viber access

## What members see

- **`/chlenstvo`** (main menu "Членство"): the active plans from `membership_plans`, with price, features and the Viber
  groups each plan opens. Until an admin creates plans, the two plans from `src/content/plans.ts` are shown (the €21
  price marked as provisional) with a "Скоро" note.
- **"Стани член"** goes to sign-up with the plan chosen (`joinPlanPath`). After confirming the email the member lands on
  **Моят профил → Моите абонаменти** with that plan highlighted. A signed-in member skips sign-up and goes straight there.
  Give the database plans the slugs `klub-krasota` and `viber-obshtnost` so the club and Viber pages link to them.
- **Моите абонаменти**: subscribe by card (Stripe, renews monthly, can be stopped any time) or by bank transfer (an admin
  confirms each month). Below the subscriptions, **Моите Viber групи** lists the groups the active plans open
  (`my_viber_groups()`): the invite link and instructions set by the admin, and a form where the member sends the Viber
  number to look for (`request_viber_access()`). After a lapse the groups disappear and the links are no longer readable
  (RLS on `viber_group_invites`).

## Access rules

- Card: access lasts while Stripe keeps the subscription active, plus `subscription_past_due_grace_days` while a failed
  renewal is retried.
- Bank transfer: each confirmed transfer adds one month. A missed transfer keeps access until the end of the month
  already paid, then it stops (no grace).

## Viber

Viber has no API to add or remove people from groups, so the site keeps the to-do list and the admin does it in Viber:

1. **Admin → Viber достъп → Нова група**: create the groups and paste each group's invite link. Pick which plans open
   which groups in **Admin → Членство и планове**.
2. **Admin → Viber достъп** shows "Покани" for every member with access who isn't marked as in the group yet, and
   "Премахни" for everyone marked as invited or in the group whose membership has lapsed. Mark each one after doing it.

## Daily job

`vercel.json` runs `GET /api/cron/maintenance` daily at 02:30 UTC. It calls `run_maintenance()`: bank-transfer
memberships whose month ended become `expired`, unpaid sign-ups are dropped, past events and consultations are closed.
Access itself already stops at the end of the paid period; the job keeps statuses tidy.

It needs **`CRON_SECRET`** in Vercel (Production, Sensitive, any long random string); Vercel sends it with each run.
Without it the route answers 401 and nothing runs. Admins can also run it by hand ("Обнови сега" on the admin home).

## Emails

- `subscription_bank_transfer`: transfer details when a member starts or renews a plan by bank transfer.
- `payment_confirmed`: as for other payments; for plans with Viber groups it adds that the links are in the profile.
