# Search and share previews

What search engines and social networks (Facebook, Viber, WhatsApp, Telegram, X) see. Code in `src/lib/seo`.

## Site address

All canonical URLs, share images, the sitemap and structured data use one address:

1. `NEXT_PUBLIC_SITE_URL` if set (also used for links in emails), otherwise
2. `DEFAULT_SITE_URL` in `src/lib/seo/config.ts`: `https://zhenski-sviyat.vercel.app`.

When the .org domain is ready, set `NEXT_PUBLIC_SITE_URL=https://<domain>` in Vercel (Production) and redeploy.
Nothing else changes.

## Indexing

Only the production deployment on Vercel (`VERCEL_ENV=production`) can be indexed. Everywhere else (preview
links, local builds, CI) the site sends three signals: `robots.txt` with `Disallow: /`, a `noindex, nofollow`
robots meta tag, and an `X-Robots-Tag: noindex, nofollow` header on every response.

In production, `robots.txt` allows everything except `/admin`, `/profil`, `/api/` and `/auth/`, and points to
`/sitemap.xml`. Login, sign-up, password, event sign-up and confirmation pages carry their own `noindex`.

## Page titles, descriptions and share images

`src/lib/seo/pages.ts` lists the public pages: title, description (at most 160 characters) and what the share
image says. Each page uses `pageMetadata("<key>")`, which sets the title, description, canonical URL,
Open Graph (`og:*`, locale `bg_BG`) and Twitter card tags. To change how a page shows up in Google or in a
Facebook/Viber preview, edit its entry there.

Event pages build the same tags from the database (`eventMetadata`): the event title, its summary (or date and
place when there is no summary) and an image with date, place and price.

Share images are 1200×630 PNGs drawn in code (`src/lib/seo/share-image.tsx`) with Lora and Inter and the logo:

- `/og/<key>` for the pages above, built at deploy time;
- `/og/sabitiya/<slug>` for events, drawn on request and cached by the CDN for an hour.

The fonts in `src/assets/og` are the Latin and Cyrillic subsets of Lora and Inter (SIL Open Font License, copies
alongside). The image renderer has no Cyrillic font of its own.

Pages for logged-in people (`/profil`, `/admin`) and the login pages fall back to the homepage preview.

### Link preview bots

For pages rendered on request (events, membership, contacts…) Next.js streams the meta tags in after the page
for normal browsers. Bots that only read HTML need them in `<head>`; Next.js recognises Facebook, WhatsApp,
X, LinkedIn, Slack and others, and `next.config.ts` adds Viber and Telegram (`htmlLimitedBots`).

### Checking a preview

- Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/) → paste the URL → "Scrape again"
  after changes (Facebook caches previews).
- Viber caches previews per link for a long time; send the link with `?v=2` to see a fresh one.
- Previews only work where the site is public. Vercel Authentication currently protects the `*.vercel.app`
  addresses (production included), so Facebook and Viber get the Vercel login page there until the protection is
  turned off for production or the custom domain is live.

## Structured data (JSON-LD)

`src/lib/seo/structured-data.ts`:

- homepage: the association as an `NGO` (name, short name, slogan, logo, url) and the `WebSite`;
- event pages: an `Event` with dates, status (cancelled), attendance mode, place, price in EUR and availability.
  Online events give the event page as their location, never the private meeting link.

Phone, email, address and social profiles are left out until the association publishes them. Add them to
`organizationJsonLd` (`telephone`, `email`, `address`, `sameAs`) when they are final.

Check with Google's [Rich Results Test](https://search.google.com/test/rich-results) once the site is public.

## After launch

- Add the domain in [Google Search Console](https://search.google.com/search-console) and submit
  `https://<domain>/sitemap.xml`.
- Optionally the same in Bing Webmaster Tools.

## Tests

- `tests/unit/seo.test.ts`: address and indexing rules, page metadata, JSON-LD.
- `tests/e2e/seo.spec.ts`: tags on every public page, image sizes, robots.txt/noindex on a non-production build,
  the sitemap, the organisation data.
- `tests/db/seo.spec.ts`: event tags and JSON-LD, tags in `<head>` for Facebook and Viber, the event image, events
  in the sitemap.
