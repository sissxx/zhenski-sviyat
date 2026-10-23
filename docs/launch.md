# Launch checklist

What has to happen before the site takes real members and payments. Code items are in the repo; every item marked
**Sisi** changes an outside service or costs money and waits for Sisi's go.

## Legal pages and cookies (in code)

- Pages: `/poveritelnost` (privacy), `/obshti-usloviya` (terms), `/biskvitki` (cookies). Text lives in
  `src/content/legal/*.ts`, rendered by `src/components/legal/LegalDocument.tsx`.
- The association's details (registered name, ЕИК, address, representative, email, phone) are in `src/lib/legal.ts`.
  Missing ones show as "Предстои".
- Each page shows a "Чернова" notice until `legalTextsReviewed` in `src/lib/legal.ts` is `true`, i.e. after a lawyer
  has read the texts. When the text changes, update `legalUpdatedAt`.
- The terms quote the default deadlines from `app_settings` (event cancel 48 h, consultation cancel 24 h, 2 moves,
  bank-transfer hold 5 days). If the admin changes them, change `src/content/legal/terms.ts` too.
- Cookies: the site sets only the Supabase login cookie (strictly necessary, no consent needed), so the bottom notice
  (`src/components/layout/CookieNotice.tsx`) only informs. **Adding analytics, a Facebook pixel, YouTube or Google Maps
  embeds needs a real consent banner first** and an entry on the cookie page.
- Retention periods in the privacy policy are enforced by the daily `purge-personal-data` job (docs/database.md).

## Decisions and outside setup (Sisi)

| # | Item | Why | Cost (approx.) |
|---|------|-----|----------------|
| 1 | Association details for `src/lib/legal.ts` | legally required on the privacy and terms pages | — |
| 2 | Lawyer review of the three texts, then set `legalTextsReviewed = true` | drafts written from the code, not legal advice | — |
| 3 | Refund rule: full refund when cancelled in time, none after (as written in the terms) | business decision | — |
| 4 | Domain name (.org), bought at Cloudflare Registrar, DNS in Cloudflare | public address, email sender | ~$10/year |
| 5 | Add the domain to Vercel, set `NEXT_PUBLIC_SITE_URL`, update Supabase Auth Site URL and redirect URLs, move the Stripe webhook URL | links, logins and payments use the new address | — |
| 6 | Authenticate the domain in Brevo (SPF, DKIM, DMARC records in Cloudflare), switch `EMAIL_FROM_ADDRESS` off Gmail | emails from Gmail land in spam | free |
| 7 | Vercel Pro | Hobby is non-commercial only; the site takes payments | $20/month |
| 8 | Supabase Pro | daily backups (7 days), no pausing when idle | $25/month |
| 9 | Stripe live mode: activate the account (association documents, bank account for payouts), live keys in Vercel, live webhook, `STRIPE_ALLOW_LIVE=true` | real card payments | Stripe fees per payment |
| 10 | Vercel Authentication on production: off, or only on previews | Facebook/Viber previews and visitors can't see the vercel.app URL while it is on (a custom domain is not affected) | — |
| 11 | Apply the `20261023180000_data_retention.sql` migration to the live database | turns on the retention job | — |
