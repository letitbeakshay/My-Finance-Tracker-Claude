-- Finance Tracker: sub-categories, "pleases God", reimbursement tracking.
-- Safe to run more than once. Does not change or remove any existing data.

-- A category can sit under another one (Coffee under Eating Out).
alter table categories add column if not exists parent_id text references categories(id) on delete set null;
-- Spending here is paid back by someone else (kept apart from your own spending).
alter table categories add column if not exists reimbursable boolean not null default false;
-- The type suggested on the Type screen for this category.
alter table categories add column if not exists default_type text
  check (default_type in ('need', 'want', 'savings', 'giving'));

-- Did this spending please God? (null = not answered, e.g. older expenses)
alter table expenses add column if not exists pleases_god boolean;
-- For reimbursable categories: has the money been paid back?
alter table expenses add column if not exists reimbursed boolean not null default false;

create index if not exists categories_parent_idx on categories (parent_id);

-- Make the API pick up the new columns straight away.
notify pgrst, 'reload schema';
