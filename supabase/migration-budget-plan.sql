-- Finance Tracker: monthly budget plan (named lines like "PNB EMI ₹12,000" whose total is the overall budget).
-- Safe to run more than once. Does not change or remove any existing data.

create table if not exists budget_items (
  id text primary key,
  name text not null,
  amount numeric not null check (amount >= 0),
  category_id text references categories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

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

notify pgrst, 'reload schema';
