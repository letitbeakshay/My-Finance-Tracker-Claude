# Finance Tracker

A mobile-first money tracker built around stewardship: log an expense in seconds, say whether it pleased God,
give first, plan monthly budgets, build savings plans and see a clear way out of debt.

## What it does

- Quick expense entry (amount, category, type, how you paid), with budget impact shown as you go
- Dashboard: transactions, budgets, savings plans, loans with repayment schedules, cards and accounts
- Bank statement (PDF) import, read on your device
- Accounts for everyone: sign up with email and password; each person sees only their own data

## Stack

- React + TypeScript + Vite, Tailwind CSS v4, Framer Motion, Recharts
- Supabase: Postgres, Auth, Row Level Security and realtime (see `supabase/README.md`)
- `vite-plugin-pwa` so it installs like an app
- Hosted on GitHub Pages

## Develop

```bash
npm install
cp .env.example .env   # add your Supabase URL and public (anon) key
npm run dev            # add ?demo to the address to see sample data without signing in
```

## Build

```bash
npm run build
```

Deploys run from GitHub Actions on every push to `main`: the database setup is applied, then the site is built and published.
