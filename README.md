# Finance Tracker

A mobile-first personal expense tracker. Log a UPI/card/cash/bank expense in
under 5 seconds; see needs/wants/savings splits, category and payment-method
breakdowns, and monthly insights.

Not accounting software, not a budgeting app, no bank sync — just the fastest
possible manual expense log.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (dark theme, design tokens in `src/index.css`)
- Framer Motion (animations), Recharts (charts)
- Dexie (IndexedDB) for local-first storage — see `src/db/`
- `vite-plugin-pwa` for offline install

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Architecture notes

The data layer (`src/db/db.ts`, `src/db/repository.ts`) and types
(`src/types/index.ts`) already reserve fields/tables for features not yet
built — budgets, recurring expenses, income, multiple wallets, cloud sync —
so those can be added later without a schema rewrite.