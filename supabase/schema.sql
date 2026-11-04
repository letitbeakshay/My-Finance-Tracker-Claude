-- Finance Tracker — Supabase schema
-- Safe to re-run any time: every statement is idempotent, so this file is
-- both the fresh-install script and the migration script for an existing
-- database (new tables/columns get added, existing ones are left alone).
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
  sort_order integer not null default 0,
  wallet_id text,
  created_at timestamptz not null default now()
);

-- Safety net for a database that already has `categories` from before
-- sort_order existed.
alter table categories add column if not exists sort_order integer not null default 0;

-- Backfill sort_order for any existing rows that are all still at the
-- default 0 (i.e. never explicitly ordered yet), using creation order.
do $$
begin
  if not exists (select 1 from categories where sort_order <> 0) then
    with ordered as (
      select id, row_number() over (order by created_at) - 1 as rn
      from categories
    )
    update categories set sort_order = ordered.rn
    from ordered
    where categories.id = ordered.id;
  end if;
end $$;

create table if not exists payment_accounts (
  id text primary key,
  label text not null,
  type text not null check (type in ('bank_account', 'credit_card')),
  bank_name text,
  last4 text,
  icon text not null default '🏦',
  archived boolean not null default false,
  sort_order integer not null default 0,
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
  account_id text references payment_accounts(id),
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

-- Safety net for a database that already has `expenses` from before
-- account_id existed.
alter table expenses add column if not exists account_id text references payment_accounts(id);

create table if not exists app_settings (
  id text primary key default 'app',
  currency text not null default '₹',
  onboarded_at timestamptz
);

create table if not exists incomes (
  id text primary key,
  amount numeric not null,
  source text not null,
  account_id text references payment_accounts(id),
  notes text,
  date date not null,
  created_at timestamptz not null default now()
);

-- Money borrowed from (kind = 'borrowed') or lent to (kind = 'lent') someone.
-- Outstanding balance is principal - paid.
create table if not exists loans (
  id text primary key,
  name text not null,
  kind text not null default 'borrowed' check (kind in ('borrowed', 'lent')),
  principal numeric not null,
  paid numeric not null default 0,
  emi numeric,
  next_due_date date,
  notes text,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Stewardship plan (giving / saving targets, large-purchase pause).
alter table app_settings add column if not exists giving_percent numeric not null default 10;
alter table app_settings add column if not exists saving_percent numeric not null default 10;
alter table app_settings add column if not exists pause_threshold numeric not null default 2000;
alter table app_settings add column if not exists giving_seeded boolean not null default false;

-- Allow 'giving' as an expense type. The original check constraint is
-- replaced; the loop finds it by definition so this is safe to re-run.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'expenses'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%need%want%savings%'
      and pg_get_constraintdef(oid) not ilike '%giving%'
  loop
    execute format('alter table expenses drop constraint %I', c);
  end loop;
  if not exists (
    select 1 from pg_constraint where conrelid = 'expenses'::regclass and conname = 'expenses_type_check'
  ) then
    alter table expenses add constraint expenses_type_check
      check (type in ('need', 'want', 'savings', 'giving'));
  end if;
end $$;

-- Monthly accountability reflection; id is the month, 'yyyy-MM'.
create table if not exists reflections (
  id text primary key,
  gratitude text,
  improve text,
  commitment text,
  updated_at timestamptz not null default now()
);

-- Monthly spending limits. id is 'overall' (all needs + wants) or a category id.
create table if not exists budgets (
  id text primary key,
  category_id text references categories(id) on delete cascade,
  monthly_limit numeric not null check (monthly_limit > 0),
  created_at timestamptz not null default now()
);

create index if not exists incomes_date_idx on incomes (date);

create index if not exists expenses_date_idx on expenses (date);
create index if not exists expenses_category_id_idx on expenses (category_id);
create index if not exists expenses_account_id_idx on expenses (account_id);

alter table categories enable row level security;
alter table payment_accounts enable row level security;
alter table expenses enable row level security;
alter table app_settings enable row level security;
alter table incomes enable row level security;
alter table loans enable row level security;
alter table reflections enable row level security;
alter table budgets enable row level security;

drop policy if exists "categories_allow_all" on categories;
create policy "categories_allow_all" on categories for all using (true) with check (true);

drop policy if exists "payment_accounts_allow_all" on payment_accounts;
create policy "payment_accounts_allow_all" on payment_accounts for all using (true) with check (true);

drop policy if exists "expenses_allow_all" on expenses;
create policy "expenses_allow_all" on expenses for all using (true) with check (true);

drop policy if exists "app_settings_allow_all" on app_settings;
create policy "app_settings_allow_all" on app_settings for all using (true) with check (true);

drop policy if exists "incomes_allow_all" on incomes;
create policy "incomes_allow_all" on incomes for all using (true) with check (true);

drop policy if exists "loans_allow_all" on loans;
create policy "loans_allow_all" on loans for all using (true) with check (true);

drop policy if exists "reflections_allow_all" on reflections;
create policy "reflections_allow_all" on reflections for all using (true) with check (true);

drop policy if exists "budgets_allow_all" on budgets;
create policy "budgets_allow_all" on budgets for all using (true) with check (true);

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
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payment_accounts'
  ) then
    alter publication supabase_realtime add table payment_accounts;
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

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incomes'
  ) then
    alter publication supabase_realtime add table incomes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'loans'
  ) then
    alter publication supabase_realtime add table loans;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reflections'
  ) then
    alter publication supabase_realtime add table reflections;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budgets'
  ) then
    alter publication supabase_realtime add table budgets;
  end if;
end $$;
