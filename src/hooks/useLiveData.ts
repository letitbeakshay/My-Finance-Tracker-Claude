import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { effectiveBudgets } from '../lib/budgets'
import { appliesInMonth, monthKey } from '../lib/planMonth'
import type { AppSettings, Budget, BudgetItem, SavingsPlan, Category, Expense, Income, Loan, PaymentAccount, Reflection } from '../types'
import {
  rowToBudget,
  rowToBudgetItem,
  rowToCategory,
  rowToExpense,
  rowToIncome,
  rowToLoan,
  rowToSavingsPlan,
  type SavingsPlanRow,
  rowToReflection,
  rowToPaymentAccount,
  type AppSettingsRow,
  type BudgetItemRow,
  type BudgetRow,
  type CategoryRow,
  type ExpenseRow,
  type IncomeRow,
  type LoanRow,
  type ReflectionRow,
  type PaymentAccountRow,
} from '../db/schema'

/** Dev server only: `?demo` swaps in sample data (see src/dev/demoData.ts). */
const SHOW_DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

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
      if (SHOW_DEMO) {
        const { DEMO_TABLES } = await import('../dev/demoData')
        if (!cancelled && DEMO_TABLES[table]) setData((DEMO_TABLES[table] as Row[]).map(mapRow))
        return
      }
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

export function useIncomes() {
  return useSupabaseTable<IncomeRow, Income>('incomes', rowToIncome, (q) =>
    q.select('*').order('date', { ascending: false }),
  )
}

export function useLoans() {
  return useSupabaseTable<LoanRow, Loan>('loans', rowToLoan, (q) =>
    q.select('*').order('created_at', { ascending: false }),
  )
}

export function useReflections() {
  return useSupabaseTable<ReflectionRow, Reflection>('reflections', rowToReflection, (q) =>
    q.select('*'),
  )
}

export function useBudgets() {
  return useSupabaseTable<BudgetRow, Budget>('budgets', rowToBudget, (q) => q.select('*'))
}

/** Category limits including those that come from the monthly plan. Undefined until loaded. */
export function useEffectiveBudgets(month: Date = new Date()) {
  const budgets = useBudgets()
  const items = useBudgetItems()
  const key = monthKey(month)
  // Only the plan lines that apply in that month give category limits.
  return useMemo(
    () => (budgets ? effectiveBudgets(budgets, (items ?? []).filter((i) => appliesInMonth(i, key))) : undefined),
    [budgets, items, key],
  )
}

export function useBudgetItems() {
  return useSupabaseTable<BudgetItemRow, BudgetItem>('budget_items', rowToBudgetItem, (q) =>
    q.select('*').order('sort_order', { ascending: true }),
  )
}

export function useCategories() {
  return useSupabaseTable<CategoryRow, Category>('categories', rowToCategory, (q) =>
    q.select('*').eq('archived', false).order('sort_order', { ascending: true }),
  )
}

export function useAllCategories() {
  return useSupabaseTable<CategoryRow, Category>('categories', rowToCategory, (q) =>
    q.select('*').order('sort_order', { ascending: true }),
  )
}

export function usePaymentAccounts() {
  return useSupabaseTable<PaymentAccountRow, PaymentAccount>(
    'payment_accounts',
    rowToPaymentAccount,
    (q) => q.select('*').eq('archived', false).order('sort_order', { ascending: true }),
  )
}

export function useAllPaymentAccounts() {
  return useSupabaseTable<PaymentAccountRow, PaymentAccount>(
    'payment_accounts',
    rowToPaymentAccount,
    (q) => q.select('*').order('sort_order', { ascending: true }),
  )
}

export function useSettings() {
  const rows = useSupabaseTable<AppSettingsRow, AppSettings>('app_settings', (row) => ({
    id: 'app',
    currency: row.currency,
    onboardedAt: row.onboarded_at ? new Date(row.onboarded_at).getTime() : undefined,
    givingPercent: Number(row.giving_percent ?? 10),
    savingPercent: Number(row.saving_percent ?? 10),
    pauseThreshold: Number(row.pause_threshold ?? 2000),
  }), (q) => q.select('*').eq('id', 'app'))
  return rows?.[0]
}

export function useSavingsPlans() {
  return useSupabaseTable<SavingsPlanRow, SavingsPlan>('savings_plans', rowToSavingsPlan, (q) =>
    q.select('*').order('sort_order', { ascending: true }),
  )
}
