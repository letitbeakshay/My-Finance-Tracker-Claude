# Database

`schema.sql` is the whole database setup and the only file you need. It is safe to run any number of times and
never removes data: it creates anything missing, adds new columns, and installs the data-safety archive.

Ways it gets applied:

1. **Automatically on every deploy** (once you add the `SUPABASE_ACCESS_TOKEN` secret to the GitHub repo). The deploy runs
   `node scripts/db-migrate.mjs`, which sends `schema.sql` to your Supabase project. Without the secret it is skipped.
2. **From your computer:** `npm run db:migrate`, with a token in `SUPABASE_ACCESS_TOKEN` or in the file
   `~/.config/finance-tracker/supabase-token`.
3. **By hand:** when the app shows "The database needs a quick update", tap **Copy the SQL**, paste it into the
   Supabase SQL Editor and press **Run**.

To get a token: Supabase dashboard, Account, Access Tokens, Generate new token.

When a new feature needs a table or column, it goes into `schema.sql` (as `create table if not exists` /
`add column if not exists`) and a matching check goes into `src/lib/schemaStatus.ts`.
