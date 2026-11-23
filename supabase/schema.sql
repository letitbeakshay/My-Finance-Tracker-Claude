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

-- ---------------------------------------------------------------------------------------------------------
-- Sharing. Two kinds, both read-only for the other person:
--   couple          two people see each other's money, read-only, both ways (expenses, plan, loans, savings)
--   accountability  the owner lets one partner see everything, read-only (one way)
-- Nobody can read or change this table directly; everything goes through the functions below, which check
-- who is asking. The app's own screens keep reading only the signed-in person's rows.
create table if not exists shares (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('couple', 'accountability')),
  invite_email text not null,
  viewer_id uuid references auth.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index if not exists shares_owner_kind_email on shares (owner_id, kind, lower(invite_email));
alter table shares enable row level security;
revoke all on shares from anon, authenticated;

-- Invite emails go through the same Apps Script as the waiting list, once it knows how to send them.
alter table waitlist_hook add column if not exists invites boolean not null default false;

create or replace function share_me_email() returns text
language sql stable security definer set search_path = public as $$
  select lower(email) from auth.users where id = auth.uid()
$$;
revoke all on function share_me_email() from public, anon, authenticated;

create or replace function share_person(uid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', u.id, 'email', u.email, 'name', coalesce(nullif(trim(u.raw_user_meta_data->>'name'), ''), split_part(u.email, '@', 1)))
  from auth.users u where u.id = uid
$$;
revoke all on function share_person(uuid) from public, anon, authenticated;

-- True when the signed-in person may see `owner`'s data ('summary' or 'full'; both kinds currently allow both).
create or replace function share_can_view(owner uuid, level text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from shares s where s.status = 'active' and (
      (s.kind = 'accountability' and s.owner_id = owner and s.viewer_id = auth.uid())
      or (s.kind = 'couple' and (
        (s.owner_id = owner and s.viewer_id = auth.uid()) or (s.owner_id = auth.uid() and s.viewer_id = owner)))
    )
  )
$$;
revoke all on function share_can_view(uuid, text) from public, anon, authenticated;

-- Invite someone by email. Returns 'sent' (an email is on its way) or 'saved' (share the link yourself).
create or replace function invite_share(p_email text, p_kind text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  e text := lower(trim(coalesce(p_email, '')));
  row shares;
  link text;
  sent boolean := false;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if p_kind not in ('couple', 'accountability') then raise exception 'Unknown kind of sharing.'; end if;
  if char_length(e) > 254 or e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Please enter a valid email address.'; end if;
  if e = share_me_email() then raise exception 'That is your own email address.'; end if;
  if p_kind = 'couple' and exists (select 1 from shares where kind = 'couple' and status = 'active' and (owner_id = me or viewer_id = me)) then
    raise exception 'You already share with a partner. Remove that first to invite someone else.';
  end if;
  if (select count(*) from shares where owner_id = me and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You have sent a lot of invites today. Please try again tomorrow.';
  end if;
  insert into shares (owner_id, kind, invite_email) values (me, p_kind, e)
  on conflict (owner_id, kind, lower(invite_email)) do update set created_at = now()
  returning * into row;
  if row.status = 'active' then raise exception 'You already share with this person.'; end if;
  link := 'https://faithfulportion.site/app/?invite=' || row.token;
  if exists (select 1 from waitlist_hook where id = 1 and invites) then
    sent := waitlist_notify(jsonb_build_object(
      'action', 'invite', 'email', e, 'kind', p_kind, 'link', link,
      'from_name', share_person(me)->>'name', 'from_email', share_person(me)->>'email'));
  end if;
  return jsonb_build_object('id', row.id, 'status', case when sent then 'sent' else 'saved' end, 'link', link);
end $$;
revoke all on function invite_share(text, text) from public, anon;
grant execute on function invite_share(text, text) to authenticated;

-- What an invite link is for, so the app can ask "Accept?" before anything is shared.
create or replace function share_invite_info(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare row shares;
begin
  select * into row from shares where token = p_token;
  if not found then return null; end if;
  return jsonb_build_object('kind', row.kind, 'status', row.status, 'from', share_person(row.owner_id),
    'for_me', lower(row.invite_email) = share_me_email(), 'invite_email', row.invite_email);
end $$;
revoke all on function share_invite_info(text) from public, anon;
grant execute on function share_invite_info(text) to authenticated;

create or replace function accept_share(p_token text)
returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); row shares;
begin
  select * into row from shares where token = p_token for update;
  if not found then raise exception 'This invite is no longer valid. Ask for a new one.'; end if;
  if row.status = 'active' then
    if row.viewer_id = me then return row.kind; end if;
    raise exception 'This invite has already been used.';
  end if;
  if lower(row.invite_email) <> share_me_email() then
    raise exception 'This invite was sent to %. Sign in with that email to accept it.', row.invite_email;
  end if;
  if row.owner_id = me then raise exception 'You cannot accept your own invite.'; end if;
  if row.kind = 'couple' and exists (select 1 from shares where kind = 'couple' and status = 'active'
      and (owner_id in (me, row.owner_id) or viewer_id in (me, row.owner_id))) then
    raise exception 'One of you already shares with a partner.';
  end if;
  update shares set viewer_id = me, status = 'active', accepted_at = now() where id = row.id;
  return row.kind;
end $$;
revoke all on function accept_share(text) from public, anon;
grant execute on function accept_share(text) to authenticated;

-- Stop sharing (either side) or decline an invite sent to you.
create or replace function remove_share(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from shares where id = p_id and (owner_id = auth.uid() or viewer_id = auth.uid()
    or (status = 'pending' and lower(invite_email) = share_me_email()));
end $$;
revoke all on function remove_share(bigint) from public, anon;
grant execute on function remove_share(bigint) to authenticated;

-- Everything the signed-in person shares, is shared with, or is invited to.
create or replace function my_shares()
returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]'::jsonb) from (
    select jsonb_build_object('id', s.id, 'kind', s.kind, 'status', s.status, 'created_at', s.created_at,
      'role', case when s.owner_id = auth.uid() then 'owner' when s.viewer_id = auth.uid() then 'viewer' else 'invited' end,
      'invite_email', s.invite_email,
      'token', case when s.viewer_id is null and lower(s.invite_email) = share_me_email() then s.token end,
      'link', case when s.owner_id = auth.uid() and s.status = 'pending' then 'https://faithfulportion.site/app/?invite=' || s.token end,
      'other', case when s.owner_id = auth.uid() then share_person(s.viewer_id) else share_person(s.owner_id) end) as x
    from shares s
    where s.owner_id = auth.uid() or s.viewer_id = auth.uid() or (s.status = 'pending' and lower(s.invite_email) = share_me_email())
  ) q
$$;
revoke all on function my_shares() from public, anon;
grant execute on function my_shares() to authenticated;

-- Month summary (totals and plan) for a couple partner or an accountability partner.
create or replace function shared_summary(p_owner uuid, p_month text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m_start date := to_date(p_month || '-01', 'YYYY-MM-DD');
  m_end date := (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month')::date;
  result jsonb;
begin
  if not share_can_view(p_owner, 'summary') then raise exception 'You do not have access to this.'; end if;
  with reimb as (
    select c.id from categories c where c.user_id = p_owner and (c.reimbursable or exists (
      select 1 from categories p where p.id = c.parent_id and p.user_id = p_owner and p.reimbursable))
  ), ex as (
    select e.* from expenses e where e.user_id = p_owner and e.date >= m_start and e.date < m_end
      and e.category_id not in (select id from reimb)
  ), tops as (
    select coalesce(p.id, c.id) as id, coalesce(p.name, c.name) as name, coalesce(p.icon, c.icon) as icon, sum(e.amount) as total
    from ex e join categories c on c.id = e.category_id and c.user_id = p_owner
    left join categories p on p.id = c.parent_id and p.user_id = p_owner
    group by 1, 2, 3
  ), plan as (
    select b.name, b.amount, b.sort_order,
      coalesce((select sum(e.amount) from ex e join categories c on c.id = e.category_id and c.user_id = p_owner
        where c.id = any(b.category_ids) or c.parent_id = any(b.category_ids)), 0) as spent
    from budget_items b where b.user_id = p_owner and (
      (not b.recurring and b.start_month = p_month)
      or (b.recurring and (b.start_month is null or b.start_month <= p_month) and (b.end_month is null or b.end_month >= p_month)))
  )
  select jsonb_build_object(
    'person', share_person(p_owner),
    'month', p_month,
    'currency', (select currency from app_settings where user_id = p_owner and id = 'app'),
    'giving_percent', (select giving_percent from app_settings where user_id = p_owner and id = 'app'),
    'saving_percent', (select saving_percent from app_settings where user_id = p_owner and id = 'app'),
    'income', coalesce((select sum(amount) from incomes where user_id = p_owner and date >= m_start and date < m_end
      and lower(trim(source)) not like 'reimbursement%'), 0),
    'spent', coalesce((select sum(amount) from ex), 0),
    'by_type', (select coalesce(jsonb_object_agg(type, total), '{}'::jsonb) from (select type, sum(amount) total from ex group by type) t),
    'categories', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'icon', icon, 'total', total) order by total desc), '[]'::jsonb) from tops),
    'plan', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'amount', amount, 'spent', spent) order by sort_order), '[]'::jsonb) from plan),
    'level', case when share_can_view(p_owner, 'full') then 'full' else 'summary' end
  ) into result;
  return result;
end $$;
revoke all on function shared_summary(uuid, text) from public, anon;
grant execute on function shared_summary(uuid, text) to authenticated;

-- Full read-only data for a couple partner or an accountability partner: the last 13 months plus loans and savings.
create or replace function shared_full(p_owner uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since date := (date_trunc('month', now()) - interval '12 months')::date;
begin
  if not share_can_view(p_owner, 'full') then raise exception 'You do not have access to this.'; end if;
  return jsonb_build_object(
    'person', share_person(p_owner),
    'categories', (select coalesce(jsonb_agg(to_jsonb(c) - 'user_id'), '[]'::jsonb) from categories c where c.user_id = p_owner),
    'payment_accounts', (select coalesce(jsonb_agg(to_jsonb(a) - 'user_id'), '[]'::jsonb) from payment_accounts a where a.user_id = p_owner),
    'expenses', (select coalesce(jsonb_agg(to_jsonb(e) - 'user_id' order by e.date desc, e.created_at desc), '[]'::jsonb) from expenses e where e.user_id = p_owner and e.date >= since),
    'incomes', (select coalesce(jsonb_agg(to_jsonb(i) - 'user_id' order by i.date desc), '[]'::jsonb) from incomes i where i.user_id = p_owner and i.date >= since),
    'loans', (select coalesce(jsonb_agg(to_jsonb(l) - 'user_id'), '[]'::jsonb) from loans l where l.user_id = p_owner),
    'savings_plans', (select coalesce(jsonb_agg(to_jsonb(sp) - 'user_id'), '[]'::jsonb) from savings_plans sp where sp.user_id = p_owner),
    'budget_items', (select coalesce(jsonb_agg(to_jsonb(b) - 'user_id'), '[]'::jsonb) from budget_items b where b.user_id = p_owner)
  );
end $$;
revoke all on function shared_full(uuid) from public, anon;
grant execute on function shared_full(uuid) to authenticated;

-- For the scheduled keep-alive job (.github/workflows/keep-alive.yml): a real database query, so the free
-- plan does not pause, that the public key may run. It returns only 'ok' and reveals nothing.
create or replace function keep_alive()
returns text
language sql stable security definer set search_path = public as $$
  select case when (select count(*) from waitlist) >= 0 then 'ok' else 'ok' end
$$;
revoke all on function keep_alive() from public;
grant execute on function keep_alive() to anon, authenticated;

-- Make the API pick up any new tables and columns straight away.
notify pgrst, 'reload schema';
