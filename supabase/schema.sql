-- Finance Tracker — Supabase schema
-- Safe to re-run any time: every statement is idempotent, so this file is
-- both the fresh-install script and the migration script for an existing
-- database (new tables/columns get added, existing ones are left alone).
--
-- Accounts: people sign up with Supabase Auth, and every row belongs to the person
-- who created it (user_id). Row Level Security lets each signed-in person read and
-- change only their own rows. See the "Accounts" section at the end of this file.

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

-- A plan line either repeats every month or belongs to one month only.
alter table budget_items add column if not exists recurring boolean not null default true;
alter table budget_items add column if not exists start_month text;
alter table budget_items add column if not exists end_month text;
update budget_items set start_month = to_char(created_at, 'YYYY-MM') where start_month is null;

alter table budget_items enable row level security;
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

-- Savings plans: FD, RD, SIP, emergency fund… with a target, and where each is kept.
create table if not exists savings_plans (
  id text primary key,
  name text not null,
  kind text not null default 'other',
  institution text,
  account_id text references payment_accounts(id) on delete set null,
  target numeric,
  monthly numeric,
  opening numeric not null default 0,
  interest_rate numeric,
  start_date date,
  maturity_date date,
  notes text,
  closed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table savings_plans enable row level security;
alter table expenses add column if not exists savings_plan_id text references savings_plans(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'savings_plans'
  ) then
    alter publication supabase_realtime add table savings_plans;
  end if;
end $$;

do $$
begin
  if to_regproc('archive_row') is not null then
    drop trigger if exists archive_savings_plans on savings_plans;
    create trigger archive_savings_plans before update or delete on savings_plans
      for each row execute function archive_row();
  end if;
end $$;

alter table incomes enable row level security;
alter table loans enable row level security;
alter table reflections enable row level security;
alter table budgets enable row level security;

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


-- ---------------------------------------------------------------------------
-- Accounts. Every row belongs to the person who signed in (user_id, filled in
-- automatically from their login). Nobody can see or change anyone else's rows.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'payment_accounts', 'expenses', 'app_settings', 'incomes',
    'loans', 'budgets', 'budget_items', 'savings_plans', 'reflections'
  ] loop
    execute format(
      'alter table %I add column if not exists user_id uuid default auth.uid() references auth.users(id) on delete cascade', t);
    execute format('create index if not exists %I on %I (user_id)', t || '_user_idx', t);
  end loop;
end $$;

-- Rows that are saved by someone else's reference (a category, a bank account, a savings plan)
-- must point at that person's own things, never at another person's.
create or replace function check_owned_refs() returns trigger
language plpgsql as $$
declare j jsonb := to_jsonb(new);
begin
  if j->>'category_id' is not null and not exists (select 1 from categories where id = j->>'category_id') then
    raise exception 'That category is not yours.';
  end if;
  if j->>'parent_id' is not null and not exists (select 1 from categories where id = j->>'parent_id') then
    raise exception 'That category is not yours.';
  end if;
  if j->>'account_id' is not null and not exists (select 1 from payment_accounts where id = j->>'account_id') then
    raise exception 'That account is not yours.';
  end if;
  if j->>'savings_plan_id' is not null and not exists (select 1 from savings_plans where id = j->>'savings_plan_id') then
    raise exception 'That savings plan is not yours.';
  end if;
  if jsonb_typeof(j->'category_ids') = 'array' and exists (
    select 1 from jsonb_array_elements_text(j->'category_ids') x where not exists (select 1 from categories c where c.id = x)
  ) then
    raise exception 'That category is not yours.';
  end if;
  return new;
end $$;

do $$
begin
  drop trigger if exists owned_refs on categories;
  create trigger owned_refs before insert or update of parent_id on categories for each row execute function check_owned_refs();
  drop trigger if exists owned_refs on expenses;
  create trigger owned_refs before insert or update of category_id, account_id, savings_plan_id on expenses for each row execute function check_owned_refs();
  drop trigger if exists owned_refs on budgets;
  create trigger owned_refs before insert or update of category_id on budgets for each row execute function check_owned_refs();
  drop trigger if exists owned_refs on budget_items;
  create trigger owned_refs before insert or update of category_id, category_ids on budget_items for each row execute function check_owned_refs();
  drop trigger if exists owned_refs on savings_plans;
  create trigger owned_refs before insert or update of account_id on savings_plans for each row execute function check_owned_refs();
  drop trigger if exists owned_refs on incomes;
  create trigger owned_refs before insert or update of account_id on incomes for each row execute function check_owned_refs();
end $$;

-- Deletes the signed-in person and everything of theirs (every table above cascades from the login).
-- The private recovery archive is cleaned too, so nothing of theirs is left behind.
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in.';
  end if;
  delete from auth.users where id = uid;
  delete from public.deleted_rows where row_data->>'user_id' = uid::text;
end $$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- @@LOCKDOWN@@
-- Everything below closes the database to the public key. Existing rows must be given to their owner
-- first (scripts/claim-data.mjs); until then they stay hidden rather than exposed.
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'payment_accounts', 'expenses', 'app_settings', 'incomes',
    'loans', 'budgets', 'budget_items', 'savings_plans', 'reflections'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_allow_all', t);
    execute format('drop policy if exists %I on %I', t || '_own', t);
    execute format(
      'create policy %I on %I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_own', t);
    execute format('revoke all on %I from anon', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
    -- Once every row has an owner, a row can never be saved without one.
    if not exists (select 1 from information_schema.columns where table_name = t and column_name = 'user_id' and is_nullable = 'NO') then
      begin
        execute format('alter table %I alter column user_id set not null', t);
      exception when not_null_violation then
        raise notice 'Table % still has rows without an owner; left as is.', t;
      end;
    end if;
  end loop;
end $$;

-- These three tables had one row per id for the whole database; now it is one per person.
do $$
declare t text; pk text;
begin
  foreach t in array array['app_settings', 'budgets', 'reflections'] loop
    select conname into pk from pg_constraint where conrelid = t::regclass and contype = 'p' and array_length(conkey, 1) = 1;
    if pk is not null and exists (
      select 1 from information_schema.columns where table_name = t and column_name = 'user_id' and is_nullable = 'NO'
    ) then
      execute format('alter table %I drop constraint %I', t, pk);
      execute format('alter table %I add primary key (user_id, id)', t);
    end if;
  end loop;
end $$;


-- Feedback from people using the app. They can send it, never read it back; you read it in the SQL editor:
--   select f.created_at, u.email, f.kind, f.message from feedback f left join auth.users u on u.id = f.user_id order by f.id desc;
create table if not exists feedback (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'idea',
  message text not null check (char_length(message) between 1 and 4000),
  app_version text,
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;
drop policy if exists feedback_insert on feedback;
create policy feedback_insert on feedback for insert to authenticated with check (user_id = (select auth.uid()));
revoke all on feedback from anon, authenticated;
grant insert on feedback to authenticated;

-- A few per hour is plenty; this stops anyone flooding the table.
create or replace function limit_feedback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from feedback where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too much feedback in a short time. Please try again later.';
  end if;
  return new;
end $$;

revoke all on function limit_feedback() from public, anon, authenticated;
drop trigger if exists limit_feedback on feedback;
create trigger limit_feedback before insert on feedback for each row execute function limit_feedback();

-- Waiting list from the public landing page (welcome/). Visitors are not signed in, so they can only
-- call join_waitlist(); nobody can read the list through the API. You read it in the SQL editor:
--   select created_at, email, name from waitlist order by id desc;
create table if not exists waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  name text,
  source text,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_key on waitlist (lower(email));

alter table waitlist enable row level security;
revoke all on waitlist from anon, authenticated;

-- Email check: join_waitlist() emails a 6-digit code (through the Google Sheet's Apps Script, below)
-- and verify_waitlist() confirms it. Everyone who joins is kept, confirmed or not.
alter table waitlist add column if not exists verified_at timestamptz;
alter table waitlist add column if not exists code text;
alter table waitlist add column if not exists code_sent_at timestamptz;
alter table waitlist add column if not exists code_tries int not null default 0;
alter table waitlist add column if not exists sends int not null default 0;
alter table waitlist add column if not exists sends_since timestamptz;
-- People who joined before the email check existed count as confirmed.
update waitlist set verified_at = created_at
where verified_at is null and code_sent_at is null and created_at < timestamptz '2026-11-22 00:00+00';

-- Copy sign-ups to a Google Sheet and send the code emails (an Apps Script web app). The address and
-- the shared secret live only in the database, never in this repo. Set or change them in the SQL editor:
--   insert into waitlist_hook (id, url, secret) values (1, '<web app url>', '<secret>')
--   on conflict (id) do update set url = excluded.url, secret = excluded.secret;
-- With no row there, nothing is sent and people join without the email check.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
end $$;

create table if not exists waitlist_hook (
  id int primary key check (id = 1),
  url text not null,
  secret text not null
);
alter table waitlist_hook enable row level security;
revoke all on waitlist_hook from anon, authenticated;

-- Earlier version sent rows from a trigger; join_waitlist now does it.
drop trigger if exists send_waitlist_to_sheet on waitlist;
drop function if exists send_waitlist_to_sheet();

-- Sends one message to the Apps Script. True when it was queued; never raises.
create or replace function waitlist_notify(payload jsonb) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare h waitlist_hook;
begin
  select * into h from waitlist_hook where id = 1;
  if h.url is null then
    return false;
  end if;
  perform net.http_post(
    url => h.url,
    body => payload || jsonb_build_object('secret', h.secret),
    headers => '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds => 10000
  );
  return true;
exception when others then
  return false;
end $$;
revoke all on function waitlist_notify(jsonb) from public, anon, authenticated;

-- Returns 'sent' (a code is on its way), 'joined' (saved; no email check possible yet) or 'verified'
-- (already confirmed). Caps new sign-ups at 100 per 10 minutes across everyone, one code per 45 seconds
-- and five codes an hour per address.
create or replace function join_waitlist(p_email text, p_name text default null, p_source text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  r waitlist;
  is_new boolean := false;
  new_code text;
begin
  if char_length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address.';
  end if;

  select * into r from waitlist where lower(email) = e;
  if found and r.verified_at is not null then
    return 'verified';
  end if;
  if not found then
    if (select count(*) from waitlist where created_at > now() - interval '10 minutes') >= 100 then
      raise exception 'Lots of people are joining right now. Please try again in a few minutes.';
    end if;
    insert into waitlist (email, name, source)
    values (e, nullif(left(trim(coalesce(p_name, '')), 80), ''), nullif(left(trim(coalesce(p_source, '')), 80), ''))
    returning * into r;
    is_new := true;
  end if;

  if not exists (select 1 from waitlist_hook where id = 1) then
    return 'joined';
  end if;
  if r.code_sent_at is not null and r.code_sent_at > now() - interval '45 seconds' then
    return 'sent';
  end if;
  if r.sends_since is null or r.sends_since < now() - interval '1 hour' then
    r.sends := 0;
    r.sends_since := now();
  end if;
  if r.sends >= 5 then
    raise exception 'We have sent several codes already. Please check your inbox or try again in an hour.';
  end if;

  new_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  update waitlist
  set code = new_code, code_sent_at = now(), code_tries = 0, sends = r.sends + 1, sends_since = r.sends_since
  where id = r.id;

  if not waitlist_notify(jsonb_build_object(
    'action', case when is_new then 'joined' else 'resend' end,
    'email', e,
    'source', coalesce(r.source, ''),
    'created_at', to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC',
    'code', new_code
  )) then
    return 'joined';
  end if;
  return 'sent';
end $$;

revoke all on function join_waitlist(text, text, text) from public;
grant execute on function join_waitlist(text, text, text) to anon, authenticated;

-- Returns 'verified', 'wrong', 'expired' (older than 15 minutes), 'locked' (five wrong tries) or
-- 'missing' (no code was sent to this address).
create or replace function verify_waitlist(p_email text, p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(trim(coalesce(p_email, '')));
  r waitlist;
begin
  select * into r from waitlist where lower(email) = e;
  if not found or (r.code is null and r.verified_at is null) then
    return 'missing';
  end if;
  if r.verified_at is not null then
    return 'verified';
  end if;
  if r.code_tries >= 5 then
    return 'locked';
  end if;
  if r.code_sent_at < now() - interval '15 minutes' then
    return 'expired';
  end if;
  if regexp_replace(coalesce(p_code, ''), '\D', '', 'g') <> r.code then
    update waitlist set code_tries = code_tries + 1 where id = r.id;
    return 'wrong';
  end if;
  update waitlist set verified_at = now(), code = null where id = r.id;
  perform waitlist_notify(jsonb_build_object(
    'action', 'verified',
    'email', e,
    'at', to_char(now() at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC'
  ));
  return 'verified';
end $$;

revoke all on function verify_waitlist(text, text) from public;
grant execute on function verify_waitlist(text, text) to anon, authenticated;

-- Make the API pick up any new tables and columns straight away.
notify pgrst, 'reload schema';
