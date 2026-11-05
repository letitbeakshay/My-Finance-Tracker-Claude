#!/usr/bin/env node
// Applies supabase/schema.sql (safe to repeat) to your Supabase project, so database changes ship with the code.
//
//   node scripts/db-migrate.mjs            apply it
//   node scripts/db-migrate.mjs --dry-run  show what would be sent
//
// It needs a Supabase access token (Supabase dashboard > Account > Access Tokens), from either:
//   - the SUPABASE_ACCESS_TOKEN environment variable (a GitHub secret in the deploy), or
//   - the file ~/.config/finance-tracker/supabase-token
// and the project address (VITE_SUPABASE_URL, from the environment or the .env file).
// With no token it does nothing and exits cleanly, so deploys never break because of it.

import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dryRun = process.argv.includes('--dry-run')
const api = (process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')

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

if (!token) {
  console.log('::notice::Database setup skipped: no Supabase access token is set (see scripts/db-migrate.mjs).')
  process.exit(0)
}

let ref = ''
try {
  ref = new URL(url).hostname.split('.')[0]
} catch {
  // handled below
}
if (!ref) {
  console.error('Could not work out the Supabase project from VITE_SUPABASE_URL.')
  process.exit(1)
}

const sql = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8')
console.log(`Applying supabase/schema.sql (${sql.split('\n').length} lines) to project ${ref}…`)
if (dryRun) {
  console.log('Dry run: nothing was sent.')
  process.exit(0)
}

const res = await fetch(`${api}/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) {
  console.error(`Database setup failed (${res.status}): ${text.slice(0, 600)}`)
  process.exit(1)
}
console.log('Database is up to date.')
