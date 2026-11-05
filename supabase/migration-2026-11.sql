-- Finance Tracker: adds incomes, loans, budgets, reflections, giving + plan settings.
-- Safe to run more than once. Does not touch your existing expenses or categories.

create table if not exists incomes (
  id text primary key,
  amount numeric not null,
  source text not null,
  account_id text references payment_accounts(id),
  notes text,
  date date not null,
  created_at timestamptz not null default now()
);

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

create table if not exists budgets (
  id text primary key,
  category_id text references categories(id) on delete cascade,
  monthly_limit numeric not null check (monthly_limit > 0),
  created_at timestamptz not null default now()
);

create table if not exists reflections (
  id text primary key,
  gratitude text,
  improve text,
  commitment text,
  updated_at timestamptz not null default now()
);

create index if not exists incomes_date_idx on incomes (date);

alter table app_settings add column if not exists giving_percent numeric not null default 10;
alter table app_settings add column if not exists saving_percent numeric not null default 10;
alter table app_settings add column if not exists pause_threshold numeric not null default 2000;
alter table app_settings add column if not exists giving_seeded boolean not null default false;

-- Allow 'giving' as an expense type.
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

alter table incomes enable row level security;
alter table loans enable row level security;
alter table budgets enable row level security;
alter table reflections enable row level security;

drop policy if exists "incomes_allow_all" on incomes;
create policy "incomes_allow_all" on incomes for all using (true) with check (true);
drop policy if exists "loans_allow_all" on loans;
create policy "loans_allow_all" on loans for all using (true) with check (true);
drop policy if exists "budgets_allow_all" on budgets;
create policy "budgets_allow_all" on budgets for all using (true) with check (true);
drop policy if exists "reflections_allow_all" on reflections;
create policy "reflections_allow_all" on reflections for all using (true) with check (true);

-- Live updates in the app.
do $$
declare t text;
begin
  foreach t in array array['incomes', 'loans', 'budgets', 'reflections'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- Make the API pick up the new tables straight away.
notify pgrst, 'reload schema';
