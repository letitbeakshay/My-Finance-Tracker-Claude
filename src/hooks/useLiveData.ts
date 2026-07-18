import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { AppSettings, Category, Expense } from '../types'
import {
  rowToCategory,
  rowToExpense,
  type AppSettingsRow,
  type CategoryRow,
  type ExpenseRow,
} from '../db/schema'

/**
 * Fetches a table once, then keeps the result live by refetching whenever
 * Supabase's realtime channel reports any change to that table. Simple
 * refetch-on-change (rather than patching individual rows) is plenty fast
 * at this app's scale and avoids subtle merge bugs.
 */
function useSupabaseTable<Row, T>(
  table: string,
  mapRow: (row: Row) => T,
  query: (q: ReturnType<typeof supabase.from>) => PromiseLike<{ data: Row[] | null; error: unknown }>,
) {
  const [data, setData] = useState<T[] | undefined>(undefined)
  const queryRef = useRef(query)
  queryRef.current = query

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: rows, error } = await queryRef.current(supabase.from(table))
      if (cancelled) return
      if (error) {
        console.error(`Failed to load ${table}`, error)
        setData([])
        return
      }
      setData((rows ?? []).map(mapRow))
    }

    load()

    // Channel names must be unique per subscriber — multiple components can
    // (and do) call the same hook for the same table at once (e.g. Home and
    // the Add Expense sheet both watching categories), so a shared name
    // collides on subscribe().
    const channel = supabase
      .channel(`${table}-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, load)
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return data
}

export function useExpenses() {
  return useSupabaseTable<ExpenseRow, Expense>('expenses', rowToExpense, (q) =>
    q.select('*').order('date', { ascending: false }),
  )
}

export function useCategories() {
  return useSupabaseTable<CategoryRow, Category>('categories', rowToCategory, (q) =>
    q.select('*').eq('archived', false).order('created_at', { ascending: true }),
  )
}

export function useAllCategories() {
  return useSupabaseTable<CategoryRow, Category>('categories', rowToCategory, (q) =>
    q.select('*').order('created_at', { ascending: true }),
  )
}

export function useSettings() {
  const rows = useSupabaseTable<AppSettingsRow, AppSettings>('app_settings', (row) => ({
    id: 'app',
    currency: row.currency,
    onboardedAt: row.onboarded_at ? new Date(row.onboarded_at).getTime() : undefined,
  }), (q) => q.select('*').eq('id', 'app'))
  return rows?.[0]
}
