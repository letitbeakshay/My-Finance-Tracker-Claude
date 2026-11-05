-- Finance Tracker: data safety net.
-- Every row that is deleted or overwritten is first copied into a private archive
-- (deleted_rows). The app and the public API key cannot read, change or delete the
-- archive, so even an accidental or malicious wipe can be undone from the SQL editor.
-- Safe to run more than once.

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
    'incomes', 'loans', 'budgets', 'reflections'
  ] loop
    execute format('drop trigger if exists archive_%1$s on %1$I', t);
    execute format(
      'create trigger archive_%1$s before update or delete on %1$I for each row execute function archive_row()',
      t
    );
  end loop;
end $$;

-- To look at what was removed:
--   select id, table_name, action, changed_at, row_data from deleted_rows order by id desc limit 50;
-- To bring one back (example for an expense, use the archive row's id):
--   insert into expenses select (jsonb_populate_record(null::expenses, row_data)).*
--   from deleted_rows where id = 123;
