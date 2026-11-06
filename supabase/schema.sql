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

alter table payment_accounts add column if not exists interest_rate numeric;
alter table payment_accounts add column if not exists credit_limit numeric;
alter table payment_accounts add column if not exists statement_day integer;
alter table payment_accounts add column if not exists due_day integer;

-- Debit cards are a third kind of account.
alter table payment_accounts drop constraint if exists payment_accounts_type_check;
alter table payment_accounts add constraint payment_accounts_type_check
  check (type in ('bank_account', 'debit_card', 'credit_card'));

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

alter table loans add column if not exists interest_rate numeric;
alter table loans add column if not exists tenure_months integer;
alter table loans add column if not exists emis_paid integer not null default 0;
alter table loans add column if not exists schedule jsonb;

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
-- Sub-categories, "pleases God" and reimbursement tracking .
-- A category can sit under another one (Coffee under Eating Out).
alter table categories add column if not exists parent_id text references categories(id) on delete set null;
-- Spending here is paid back by someone else (kept apart from your own spending).
alter table categories add column if not exists reimbursable boolean not null default false;
-- The type suggested on the Type screen for this category.
alter table categories add column if not exists default_type text
  check (default_type in ('need', 'want', 'savings', 'giving'));

-- Did this spending please God? (null = not answered, e.g. older expenses)
alter table expenses add column if not exists pleases_god boolean;
alter table expenses add column if not exists bank_ref text;
alter table incomes add column if not exists bank_ref text;
-- For reimbursable categories: has the money been paid back?
alter table expenses add column if not exists reimbursed boolean not null default false;

create index if not exists categories_parent_idx on categories (parent_id);

-- Monthly budget plan .
create table if not exists budget_items (
  id text primary key,
  name text not null,
  amount numeric not null check (amount >= 0),
  category_id text references categories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table budget_items add column if not exists category_ids text[] not null default '{}';

alter table budget_items enable row level security;
drop policy if exists "budget_items_allow_all" on budget_items;
create policy "budget_items_allow_all" on budget_items for all using (true) with check (true);

-- Live updates in the app.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budget_items'
  ) then
    alter publication supabase_realtime add table budget_items;
  end if;
end $$;

-- If the data-safety archive is installed, protect this table too.
do $$
begin
  if to_regproc('archive_row') is not null then
    drop trigger if exists archive_budget_items on budget_items;
    create trigger archive_budget_items before update or delete on budget_items
      for each row execute function archive_row();
  end if;
end $$;

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

-- ---------------------------------------------------------------------------
-- Data safety net: every row that is deleted or overwritten is first copied into a
-- private archive (deleted_rows). The app and the public API key cannot read, change
-- or delete it, so even an accidental or malicious wipe can be undone from the SQL editor.
-- To look: select id, table_name, action, changed_at, row_data from deleted_rows order by id desc limit 50;
-- ---------------------------------------------------------------------------
create table if not exists deleted_rows (
  id bigint generated always as identity primary key,
  table_name text not null,
  action text not null,            -- 'DELETE' or 'UPDATE' (the row as it was before)
  row_data jsonb not null,
  changed_at timestamptz not null default now()
);

alter table deleted_rows enable row level security;   -- no policies: the public key gets nothing
revoke all on deleted_rows from anon, authenticated;

create or replace function archive_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into deleted_rows (table_name, action, row_data)
  values (tg_table_name, tg_op, to_jsonb(old));
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

revoke all on function archive_row() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'payment_accounts', 'expenses', 'app_settings',
    'incomes', 'loans', 'budgets', 'budget_items', 'reflections'
  ] loop
    execute format('drop trigger if exists archive_%1$s on %1$I', t);
    execute format(
      'create trigger archive_%1$s before update or delete on %1$I for each row execute function archive_row()',
      t
    );
  end loop;
end $$;

-- Make the API pick up any new tables and columns straight away.
notify pgrst, 'reload schema';
