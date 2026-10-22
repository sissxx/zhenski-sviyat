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
```

Node 22 (see `.nvmrc`).

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
| `src/theme/` | Brand tokens, fonts and the MUI theme |
| `public/brand/` | Final logos (horizontal, full, wordmark, icon) as SVG and PNG; favicon lives in `src/app/icon.svg` |

## Conventions

- All user-facing text is Bulgarian; code, data fields and logs are English.
- Store timestamps in UTC and money as integer euro cents; display them only through
  `formatDate`, `formatDateTime`, `formatTime` and `formatPrice` from `src/lib/locale.ts`.
- Colours come from `theme.palette.brand` (see `src/theme/tokens.ts`), not hex values in components.
- Buttons on green panels use `color="onDark"` (light fill, green label).
