# Database

`schema.sql` is the whole database setup and the only file you need. It is safe to run any number of times and
never removes data: it creates anything missing, adds new columns, and installs the data-safety archive.

Ways it gets applied:

1. **Automatically on every deploy** (needs the `SUPABASE_ACCESS_TOKEN` secret in the GitHub repo). The deploy runs
   `node scripts/db-migrate.mjs`, which sends `schema.sql` to your Supabase project. Without the secret it is skipped.
2. **From your computer:** `npm run db:migrate`, with a token in `SUPABASE_ACCESS_TOKEN` or in the file
   `~/.config/finance-tracker/supabase-token`.

To get a token: Supabase dashboard, Account, Access Tokens, Generate new token. A token can expire: if the deploy
fails with `Invalid access token`, make a new one, save it to that file, and update the GitHub secret.

## Accounts

People sign up with Supabase Auth (email and password). Every table has a `user_id` (filled in from the login), and
Row Level Security lets each person read and change only their own rows. The public key alone gets nothing.
`delete_my_account()` removes a person and everything of theirs.

The bottom part of `schema.sql` (after `@@LOCKDOWN@@`) is what closes the tables to the public key. It only
works once every existing row has an owner, so on a database that had data before accounts existed:

1. Sign up with your own email in the app.
2. `node scripts/claim-data.mjs you@example.com` gives all the old rows to that account.
3. Run the migration again (`npm run db:migrate`, or deploy) so every `user_id` becomes required.

### Supabase settings to check

In the Supabase dashboard, Authentication:

- **Email, Confirm email:** on is the safer choice, but the built-in email service only sends a few emails an hour.
  Before many people sign up, connect your own SMTP service (Resend, Brevo…), or turn confirmation off.
- **URL Configuration:** set Site URL to the app address and add it under Redirect URLs, so the links in
  confirmation and password-reset emails come back to the app.
- **Attack Protection:** consider turning on CAPTCHA, to stop bots signing up.

When a new feature needs a table or column, it goes into `schema.sql` (as `create table if not exists` /
`add column if not exists`). Give new tables a `user_id` and add them to the two lists in the Accounts section.
