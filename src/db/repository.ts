import { supabase } from '../lib/supabaseClient'
import {
  OVERALL_BUDGET_ID,
  type AppSettings,
  type Category,
  type Expense,
  type Income,
  type Loan,
  type PaymentAccount,
  type Reflection,
} from '../types'
import {
  categoryToRow,
  expenseToRow,
  incomeToRow,
  loanToRow,
  paymentAccountToRow,
  rowToCategory,
  rowToExpense,
  rowToIncome,
  rowToLoan,
  rowToPaymentAccount,
  type CategoryRow,
  type ExpenseRow,
  type IncomeRow,
  type LoanRow,
  type PaymentAccountRow,
} from './schema'

function generateId() {
  return crypto.randomUUID()
}

export const expenseRepo = {
  async add(input: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = generateId()
    const row = expenseToRow({ ...input, id, source: input.source ?? 'manual' })
    const { data, error } = await supabase
      .from('expenses')
      .insert(row)
      .select()
      .single<ExpenseRow>()
    if (error) throw error
    return rowToExpense(data)
  },

  async update(id: string, changes: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    const row = expenseToRow({ id, ...changes } as Expense)
    delete row.id
    const { error } = await supabase
      .from('expenses')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  },

  async all() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return (data as ExpenseRow[]).map(rowToExpense)
  },
}

export const categoryRepo = {
  async add(input: Omit<Category, 'id' | 'createdAt'>) {
    const id = generateId()
    let sortOrder = input.sortOrder
    if (sortOrder == null) {
      const { data: maxRow } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle<{ sort_order: number }>()
      sortOrder = (maxRow?.sort_order ?? -1) + 1
    }
    const row = categoryToRow({ ...input, id, sortOrder })
    const { data, error } = await supabase
      .from('categories')
      .insert(row)
      .select()
      .single<CategoryRow>()
    if (error) throw error
    return rowToCategory(data)
  },

  async rename(id: string, name: string, icon?: string) {
    const { error } = await supabase
      .from('categories')
      .update(icon ? { name, icon } : { name })
      .eq('id', id)
    if (error) throw error
  },

  async archive(id: string) {
    const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id)
    if (error) throw error
  },

  async remove(id: string) {
    const { count, error: countError } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if (countError) throw countError

    if (count && count > 0) {
      const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id)
      if (error) throw error
      return { archived: true }
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    return { archived: false }
  },

  /** Persists a new drag-to-reorder position for each category, in order. */
  async reorder(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('categories').update({ sort_order: index }).eq('id', id),
      ),
    )
  },
}

export const paymentAccountRepo = {
  async add(input: Omit<PaymentAccount, 'id' | 'createdAt'>) {
    const id = generateId()
    let sortOrder = input.sortOrder
    if (sortOrder == null) {
      const { data: maxRow } = await supabase
        .from('payment_accounts')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle<{ sort_order: number }>()
      sortOrder = (maxRow?.sort_order ?? -1) + 1
    }
    const row = paymentAccountToRow({ ...input, id, sortOrder })
    const { data, error } = await supabase
      .from('payment_accounts')
      .insert(row)
      .select()
      .single<PaymentAccountRow>()
    if (error) throw error
    return rowToPaymentAccount(data)
  },

  async update(id: string, changes: Partial<Omit<PaymentAccount, 'id' | 'createdAt'>>) {
    const row = paymentAccountToRow({ id, ...changes } as PaymentAccount)
    delete row.id
    const { error } = await supabase.from('payment_accounts').update(row).eq('id', id)
    if (error) throw error
  },

  async remove(id: string) {
    const { count, error: countError } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id)
    if (countError) throw countError

    // Incomes can point at a bank account too; those must keep their link, so archive instead.
    const { count: incomeCount } = await supabase
      .from('incomes')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id)

    if ((count && count > 0) || (incomeCount && incomeCount > 0)) {
      const { error } = await supabase
        .from('payment_accounts')
        .update({ archived: true })
        .eq('id', id)
      if (error) throw error
      return { archived: true }
    }
    const { error } = await supabase.from('payment_accounts').delete().eq('id', id)
    if (error) throw error
    return { archived: false }
  },

  async reorder(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('payment_accounts').update({ sort_order: index }).eq('id', id),
      ),
    )
  },
}

export const incomeRepo = {
  async add(input: Omit<Income, 'id' | 'createdAt'>) {
    const row = incomeToRow({ ...input, id: generateId() })
    const { data, error } = await supabase.from('incomes').insert(row).select().single<IncomeRow>()
    if (error) throw error
    return rowToIncome(data)
  },

  async remove(id: string) {
    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (error) throw error
  },
}

export const loanRepo = {
  async add(input: Omit<Loan, 'id' | 'createdAt' | 'paid' | 'closed'>) {
    const row = loanToRow({ ...input, id: generateId(), paid: 0, closed: false })
    const { data, error } = await supabase.from('loans').insert(row).select().single<LoanRow>()
    if (error) throw error
    return rowToLoan(data)
  },

  /** Records a repayment; closes the loan once the principal is fully paid. */
  async recordPayment(loan: Loan, amount: number) {
    const paid = Math.min(loan.principal, loan.paid + amount)
    const { error } = await supabase
      .from('loans')
      .update({ paid, closed: paid >= loan.principal })
      .eq('id', loan.id)
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (error) throw error
  },
}

export const settingsRepo = {
  async updatePlan(changes: Pick<AppSettings, 'givingPercent' | 'savingPercent' | 'pauseThreshold'>) {
    const { error } = await supabase
      .from('app_settings')
      .update({
        giving_percent: changes.givingPercent,
        saving_percent: changes.savingPercent,
        pause_threshold: changes.pauseThreshold,
      })
      .eq('id', 'app')
    if (error) throw error
  },
}

export const reflectionRepo = {
  async save(reflection: Omit<Reflection, 'updatedAt'>) {
    const { error } = await supabase.from('reflections').upsert({
      id: reflection.id,
      gratitude: reflection.gratitude,
      improve: reflection.improve,
      commitment: reflection.commitment,
      updated_at: new Date().toISOString(),
    })
    if (error) throw error
  },
}

export const budgetRepo = {
  /** Sets the monthly limit for a category, or for `null` (overall). A limit of 0 removes it. */
  async set(categoryId: string | null, monthlyLimit: number) {
    const id = categoryId ?? OVERALL_BUDGET_ID
    if (!(monthlyLimit > 0)) {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
      return
    }
    const { error } = await supabase
      .from('budgets')
      .upsert({ id, category_id: categoryId, monthly_limit: monthlyLimit })
    if (error) throw error
  },
}

export const dataRepo = {
  /** A full backup of everything entered, including incomes, loans, budgets and reflections. */
  async exportJSON() {
    const tables = [
      'expenses',
      'categories',
      'payment_accounts',
      'app_settings',
      'incomes',
      'loans',
      'budgets',
      'reflections',
    ] as const
    const results = await Promise.all(tables.map((t) => supabase.from(t).select('*')))
    const backup: Record<string, unknown> = { exportedAt: Date.now() }
    tables.forEach((t, i) => {
      // A table missing from an older database just means nothing was ever entered in it.
      backup[t] = results[i].data ?? []
    })
    return JSON.stringify(backup, null, 2)
  },

  async exportCSV() {
    const { data: expenseRows } = await supabase.from('expenses').select('*')
    const { data: categoryRows } = await supabase.from('categories').select('*')
    const { data: accountRows } = await supabase.from('payment_accounts').select('*')
    const expenses = ((expenseRows ?? []) as ExpenseRow[]).map(rowToExpense)
    const categories = ((categoryRows ?? []) as CategoryRow[]).map(rowToCategory)
    const accounts = ((accountRows ?? []) as PaymentAccountRow[]).map(rowToPaymentAccount)
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const accountMap = new Map(accounts.map((a) => [a.id, a.label]))
    const header = ['Date', 'Category', 'Type', 'Payment Method', 'Account', 'Amount', 'Notes']
    const rows = expenses.map((e) => [
      e.date,
      categoryMap.get(e.categoryId) ?? e.categoryId,
      e.type,
      e.paymentMethod,
      (e.accountId && accountMap.get(e.accountId)) ?? '',
      e.amount.toString(),
      (e.notes ?? '').replace(/"/g, '""'),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    return csv
  },

  /** Removes everything. Children first so foreign keys never block it; stops at the first real error. */
  async deleteAll() {
    const tables = [
      'budgets',
      'incomes',
      'loans',
      'reflections',
      'expenses',
      'categories',
      'payment_accounts',
      'app_settings',
    ]
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().not('id', 'is', null)
      // PGRST205: the table doesn't exist yet in an older database, so there is nothing to delete.
      if (error && error.code !== 'PGRST205') throw error
    }
  },
}
