-- Finance Tracker — Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
--
-- Single-user, no-auth setup: RLS is enabled with permissive "allow all"
-- policies scoped to the anon key, matching the app's passcode-gate-only
-- security model. Tighten these later if real Supabase Auth is added.

create table if not exists categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text,
  archived boolean not null default false,
  wallet_id text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  amount numeric not null,
  category_id text not null references categories(id),
  type text not null check (type in ('need', 'want', 'savings')),
  payment_method text not null check (
    payment_method in ('upi', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'wallet')
  ),
  notes text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Reserved for future features (recurring automation, multi-wallet, SMS/OCR import).
  recurring_id text,
  wallet_id text,
  source text default 'manual',
  attachment_id text
);

create table if not exists app_settings (
  id text primary key default 'app',
  currency text not null default '₹',
  onboarded_at timestamptz
);

create index if not exists expenses_date_idx on expenses (date);
create index if not exists expenses_category_id_idx on expenses (category_id);

alter table categories enable row level security;
alter table expenses enable row level security;
alter table app_settings enable row level security;

drop policy if exists "categories_allow_all" on categories;
create policy "categories_allow_all" on categories for all using (true) with check (true);

drop policy if exists "expenses_allow_all" on expenses;
create policy "expenses_allow_all" on expenses for all using (true) with check (true);

drop policy if exists "app_settings_allow_all" on app_settings;
create policy "app_settings_allow_all" on app_settings for all using (true) with check (true);

-- Enable realtime so the app reflects changes instantly without polling.
-- Guarded because newer Supabase projects auto-add every public table to
-- supabase_realtime already, which makes a bare ADD TABLE fail on re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table categories;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table expenses;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_settings'
  ) then
    alter publication supabase_realtime add table app_settings;
  end if;
end $$;
