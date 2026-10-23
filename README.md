# Сдружение Женски свят

Public website and membership platform for the association Сдружение Женски свят (Women's World).
Bulgarian UI, `bg-BG` locale, `Europe/Sofia` time zone, prices in EUR.

## Stack

- Next.js (App Router) + React + TypeScript
- MUI with Emotion (`@mui/material-nextjs` for App Router SSR)
- Fonts: Lora (headings) and Inter (body), Cyrillic subsets via `next/font`

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
npm run typecheck
npm test           # unit tests (Vitest, tests/unit)
npm run test:e2e   # smoke tests in a browser (Playwright, tests/e2e); run `npm run build` first
npm run test:db    # database tests against a local Supabase (tests/db); see docs/testing.md
```

The end-to-end tests start `npm run start` on port 3100 with the Supabase, Stripe and Brevo variables blanked,
so they check what visitors see without those services. Install the browser once with
`npx playwright install chromium`, or point `PLAYWRIGHT_CHROMIUM_PATH` at an existing Chromium.
The database tests run the real pages against a throwaway local Supabase (Docker), never the live project.
GitHub Actions (`.github/workflows/ci.yml`) runs lint, types, unit, e2e and database tests on every pull request.

Node 22 (see `.nvmrc`).

### Supabase

Copy `.env.example` to `.env.local` and fill in the values from the Supabase dashboard
(project `zhenski-sviyat` → Project Settings → API Keys). Never commit `.env.local`.
On Vercel, add the same three variables under Project → Settings → Environment Variables.
Public pages still work without them; anything that reads the database needs them.

After a schema change, regenerate the types with `npm run db:types` (needs `npx supabase login` once).

## Layout

| Path | What lives there |
| --- | --- |
| `src/app/` | Routes, root layout, MUI providers, 404 page |
| `src/components/layout/` | Site header (desktop nav + mobile drawer) and footer |
| `src/components/home/` | Homepage sections (Figma frame `1:25`) |
| `src/components/ui/` | Shared building blocks (`Section`, `AppLink`) |
| `src/content/` | Static copy and sample data until the admin panel exists |
| `src/lib/locale.ts` | `bg-BG` / `Europe/Sofia` / EUR formatting helpers |
| `src/lib/routes.ts` | Public URLs and navigation menus |
| `src/lib/supabase/` | Supabase clients: `client.ts` (browser), `server.ts` (Server Components/Actions), `admin.ts` (secret key, server only), `proxy.ts` (session refresh); generated `database.types.ts` |
| `src/lib/auth/` | Account forms' schemas, server actions, Bulgarian auth errors, `requireUser` (see `docs/auth.md`) |
| `src/lib/events/`, `src/lib/consultations/` | Event sign-up and consultation booking: reads, server actions, page models (see `docs/events.md`, `docs/consultations.md`) |
| `src/lib/stripe/`, `src/lib/payments/`, `src/lib/subscriptions/` | Stripe Checkout, the webhook handlers, plan subscriptions and payment email hooks (see `docs/payments.md`) |
| `src/lib/seo/` | Site address, page titles/descriptions, share images (`/og/...`), JSON-LD; robots and sitemap in `src/app` (see `docs/seo.md`) |
| `src/components/auth/`, `src/components/account/` | Login, sign-up and password forms; account area navigation and forms |
| `src/proxy.ts` | Refreshes the Supabase session cookie on each request and guards `/profil` |
| `src/theme/` | Brand tokens, fonts and the MUI theme |
| `public/brand/` | Final logos (horizontal, full, wordmark, icon) as SVG and PNG; favicon lives in `src/app/icon.svg` |

## Conventions

- All user-facing text is Bulgarian; code, data fields and logs are English.
- Store timestamps in UTC and money as integer euro cents; display them only through
  `formatDate`, `formatDateTime`, `formatTime` and `formatPrice` from `src/lib/locale.ts`.
- Colours come from `theme.palette.brand` (see `src/theme/tokens.ts`), not hex values in components.
- Buttons on green panels use `color="onDark"` (light fill, green label).
