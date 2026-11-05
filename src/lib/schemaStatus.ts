import { supabase } from './supabaseClient'
import setupSql from '../../supabase/schema.sql?raw'

/** The full, safe-to-repeat database setup. Pasting this into the Supabase SQL Editor brings any database up to date. */
export const SETUP_SQL: string = setupSql

/** The Supabase project id, taken from the app's own database address. */
export function supabaseProjectRef() {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
  } catch {
    return ''
  }
}

export function sqlEditorUrl() {
  return `https://supabase.com/dashboard/project/${supabaseProjectRef()}/sql/new`
}

interface Probe {
  /** What is missing, in plain words. */
  label: string
  run: () => PromiseLike<{ error: { code?: string; message?: string } | null }>
}

const PROBES: Probe[] = [
  {
    label: 'Monthly budget plan',
    run: () => supabase.from('budget_items').select('id').limit(1),
  },
  {
    label: 'Sub-categories and the "pleases God" answer',
    run: async () => {
      const a = await supabase.from('categories').select('parent_id, reimbursable, default_type').limit(1)
      if (a.error) return a
      return supabase.from('expenses').select('pleases_god, reimbursed').limit(1)
    },
  },
  {
    // The archive is private, so "permission denied" means it exists; only "not found" means it is missing.
    label: 'Data safety archive (recovers deleted rows)',
    run: async () => {
      const { error } = await supabase.from('deleted_rows').select('id').limit(1)
      const missing = error && (error.code === 'PGRST205' || /schema cache|does not exist/i.test(error.message ?? ''))
      return { error: missing ? error : null }
    },
  },
]

/** Names of the database updates that have not been applied yet (empty = all up to date). */
export async function checkSchema(): Promise<string[]> {
  const results = await Promise.all(PROBES.map(async (p) => ((await p.run()).error ? p.label : null)))
  return results.filter((r): r is string => r !== null)
}
