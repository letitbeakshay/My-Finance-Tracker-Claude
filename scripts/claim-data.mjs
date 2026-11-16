#!/usr/bin/env node
// Gives all existing, ownerless rows to one account. Run once, after that account has signed up:
//
//   node scripts/claim-data.mjs you@example.com
//
// This is how the data entered before accounts existed (user_id empty) becomes yours. Safe to repeat.
// It needs the same Supabase access token as scripts/db-migrate.mjs.
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const email = (process.argv[2] || '').trim()
if (!/^[^\s'";\\]+@[^\s'";\\]+$/.test(email)) {
  console.error('Usage: node scripts/claim-data.mjs you@example.com')
  process.exit(1)
}

function readEnvFile() {
  const file = join(root, '.env')
  if (!existsSync(file)) return {}
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  )
}

const tokenFile = join(homedir(), '.config', 'finance-tracker', 'supabase-token')
const token =
  (process.env.SUPABASE_ACCESS_TOKEN || '').trim() || (existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : '')
const url = process.env.VITE_SUPABASE_URL || readEnvFile().VITE_SUPABASE_URL || ''
const ref = (() => {
  try {
    return new URL(url).hostname.split('.')[0]
  } catch {
    return ''
  }
})()
if (!token || !ref) {
  console.error('Need a Supabase access token and VITE_SUPABASE_URL (see scripts/db-migrate.mjs).')
  process.exit(1)
}

const sql = `
do $$
declare uid uuid; t text; n integer; total integer := 0;
begin
  select id into uid from auth.users where lower(email) = lower('${email}');
  if uid is null then
    raise exception 'No account with the email ${email}. Sign up with it first.';
  end if;
  foreach t in array array['categories','payment_accounts','expenses','app_settings','incomes','loans','budgets','budget_items','savings_plans','reflections'] loop
    execute format('update %I set user_id = %L where user_id is null', t, uid);
    get diagnostics n = row_count;
    total := total + n;
  end loop;
  -- Someone who already has data does not need the welcome steps.
  update app_settings set onboarded_at = coalesce(onboarded_at, now()) where user_id = uid;
  raise notice 'Gave % rows to %', total, '${email}';
end $$;
`

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) {
  console.error(`Failed (${res.status}): ${text.slice(0, 500)}`)
  process.exit(1)
}
console.log('Done. Existing rows now belong to', email)
