import { supabase } from '../lib/supabaseClient'
import { planCategories, type PlanParent } from '../lib/categoryPlan'
import { buildSchedule } from '../lib/loanMath'
import {
  OVERALL_BUDGET_ID,
  type AppSettings,
  type Category,
  type Expense,
  type Income,
  type Installment,
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

/** True when a write failed only because the categories-v2 migration has not been run yet. */
function isMissingColumn(error: { code?: string } | null) {
  return error?.code === 'PGRST204' || error?.code === '42703'
}

const NEW_EXPENSE_COLUMNS = ['pleases_god', 'reimbursed', 'bank_ref'] as const

function withoutNewColumns<T extends Record<string, unknown>>(row: T) {
  const copy: Record<string, unknown> = { ...row }
  for (const key of NEW_EXPENSE_COLUMNS) delete copy[key]
  return copy
}

export const expenseRepo = {
  async add(input: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = generateId()
    const row = expenseToRow({ ...input, id, source: input.source ?? 'manual' })
    let { data, error } = await supabase.from('expenses').insert(row).select().single<ExpenseRow>()
    if (isMissingColumn(error)) {
      // Older database: save the expense anyway, just without the newer fields.
      ;({ data, error } = await supabase
        .from('expenses')
        .insert(withoutNewColumns(row))
        .select()
        .single<ExpenseRow>())
    }
    if (error || !data) throw error
    return rowToExpense(data)
  },

  async update(id: string, changes: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    const row = expenseToRow({ id, ...changes } as Expense)
    delete row.id
    const stamp = { updated_at: new Date().toISOString() }
    let { error } = await supabase.from('expenses').update({ ...row, ...stamp }).eq('id', id)
    if (isMissingColumn(error)) {
      ;({ error } = await supabase.from('expenses').update({ ...withoutNewColumns(row), ...stamp }).eq('id', id))
    }
    if (error) throw error
  },

  /** Marks a reimbursable expense as paid back (or not). */
  async setReimbursed(id: string, reimbursed: boolean) {
    const { error } = await supabase
      .from('expenses')
      .update({ reimbursed, updated_at: new Date().toISOString() })
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

  /** Moves a category under another one (or back to the top level with `null`). */
  async setParent(id: string, parentId: string | null) {
    const { error } = await supabase.from('categories').update({ parent_id: parentId }).eq('id', id)
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

export const categoryPlanRepo = {
  /** Whether the database has the columns the plan needs (the categories-v2 migration has been run). */
  async isReady() {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('demo')) return true
    const { error } = await supabase.from('categories').select('parent_id, reimbursable, default_type').limit(1)
    return !error
  },

  /** Applies the category plan. Creates what is missing and moves/renames what exists; never deletes. */
  async apply(existing: Category[], plan?: PlanParent[]) {
    const { ops } = planCategories(existing, generateId, plan)
    for (const op of ops) {
      if (op.kind === 'create') {
        const { error } = await supabase.from('categories').insert({
          id: op.id,
          name: op.name,
          icon: op.icon,
          parent_id: op.parentId,
          reimbursable: op.reimbursable,
          default_type: op.defaultType ?? null,
          sort_order: op.sortOrder,
        })
        if (error) throw error
      } else {
        const c = op.changes
        const { error } = await supabase
          .from('categories')
          .update({
            ...(c.name !== undefined ? { name: c.name } : {}),
            ...(c.parentId !== undefined ? { parent_id: c.parentId } : {}),
            ...(c.reimbursable !== undefined ? { reimbursable: c.reimbursable } : {}),
            ...(c.defaultType !== undefined ? { default_type: c.defaultType } : {}),
            ...(c.sortOrder !== undefined ? { sort_order: c.sortOrder } : {}),
            ...(c.archived !== undefined ? { archived: c.archived } : {}),
          })
          .eq('id', op.id)
        if (error) throw error
      }
    }
    return ops.length
  },
}

function withoutCardColumns(row: Record<string, unknown>) {
  const copy = { ...row }
  for (const key of ['interest_rate', 'credit_limit', 'statement_day', 'due_day']) delete copy[key]
  return copy
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
    let { data, error } = await supabase.from('payment_accounts').insert(row).select().single<PaymentAccountRow>()
    if (isMissingColumn(error)) ({ data, error } = await supabase.from('payment_accounts').insert(withoutCardColumns(row)).select().single<PaymentAccountRow>())
    if (error || !data) throw error
    return rowToPaymentAccount(data)
  },

  async update(id: string, changes: Partial<Omit<PaymentAccount, 'id' | 'createdAt'>>) {
    const row = paymentAccountToRow({ id, ...changes } as PaymentAccount)
    delete row.id
    let { error } = await supabase.from('payment_accounts').update(row).eq('id', id)
    if (isMissingColumn(error)) ({ error } = await supabase.from('payment_accounts').update(withoutCardColumns(row)).eq('id', id))
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
    let { data, error } = await supabase.from('incomes').insert(row).select().single<IncomeRow>()
    if (isMissingColumn(error)) {
      const { bank_ref: _omit, ...plain } = row
      void _omit
      ;({ data, error } = await supabase.from('incomes').insert(plain).select().single<IncomeRow>())
    }
    if (error || !data) throw error
    return rowToIncome(data)
  },

  async remove(id: string) {
    const { error } = await supabase.from('incomes').delete().eq('id', id)
    if (error) throw error
  },
}

const NEW_LOAN_COLUMNS = ['interest_rate', 'tenure_months', 'emis_paid', 'schedule'] as const

function withoutLoanColumns(row: Record<string, unknown>) {
  const copy = { ...row }
  for (const key of NEW_LOAN_COLUMNS) delete copy[key]
  return copy
}

export type LoanInput = Pick<Loan, 'name' | 'kind' | 'principal' | 'paid' | 'emi' | 'interestRate' | 'tenureMonths' | 'emisPaid' | 'nextDueDate'> & { schedule?: Installment[] | null }

/** Every loan gets its own sub-category under EMI, so an expense can say exactly which EMI it paid. */
export async function ensureLoanCategory(loanName: string) {
  try {
    const { data: cats } = await supabase.from('categories').select('id,name,parent_id,archived')
    const list = (cats ?? []) as { id: string; name: string; parent_id: string | null; archived: boolean }[]
    let emi = list.find((c) => c.id === 'emi') ?? list.find((c) => !c.archived && c.name.toLowerCase() === 'emi')
    if (!emi) {
      const made = await categoryRepo.add({ name: 'EMI', icon: '🏦', defaultType: 'need' })
      emi = { id: made.id, name: 'EMI', parent_id: null, archived: false }
    }
    if (list.some((c) => !c.archived && c.parent_id === emi!.id && c.name.toLowerCase() === loanName.toLowerCase())) return
    await categoryRepo.add({ name: loanName, icon: '🏦', parentId: emi.id, defaultType: 'need' })
  } catch {
    /* the loan itself is saved; the category can be added later from Settings */
  }
}

export const loanRepo = {
  async add(input: LoanInput) {
    const row = loanToRow({ ...input, schedule: input.schedule ?? undefined, id: generateId(), closed: false })
    let { data, error } = await supabase.from('loans').insert(row).select().single<LoanRow>()
    if (isMissingColumn(error)) ({ data, error } = await supabase.from('loans').insert(withoutLoanColumns(row)).select().single<LoanRow>())
    if (error || !data) throw error
    await ensureLoanCategory(input.name)
    return rowToLoan(data)
  },

  /** Saves new details for a loan (amount, rate, EMIs paid…). */
  async update(loan: Loan, changes: Partial<LoanInput>) {
    const next = { ...loan, ...changes, schedule: 'schedule' in changes ? changes.schedule ?? undefined : loan.schedule }
    const row = loanToRow(next)
    delete row.id
    let { error } = await supabase.from('loans').update(row).eq('id', loan.id)
    if (isMissingColumn(error)) ({ error } = await supabase.from('loans').update(withoutLoanColumns(row)).eq('id', loan.id))
    if (error) throw error
  },

  /**
   * Saves a repayment schedule and keeps everything that follows from it in step: how many EMIs are paid,
   * the principal repaid so far, the next due date, and whether the loan is closed.
   */
  async saveSchedule(loan: Loan, rows: Installment[], extra: Partial<LoanInput> = {}) {
    const principal = extra.principal ?? loan.principal
    const paidRows = rows.filter((r) => r.paid)
    const nextUnpaid = rows.find((r) => !r.paid)
    const principalPaid = Math.min(principal, paidRows.reduce((sum, r) => sum + r.principal, 0))
    await this.update(loan, {
      ...extra,
      schedule: rows,
      emisPaid: paidRows.length,
      paid: Math.round(principalPaid * 100) / 100,
      nextDueDate: nextUnpaid?.date ?? loan.nextDueDate,
    })
    const closed = rows.length > 0 && !nextUnpaid
    if (closed !== loan.closed) await supabase.from('loans').update({ closed }).eq('id', loan.id)
  },

  /** Ticks (or un-ticks) one instalment. */
  async setInstallmentPaid(loan: Loan, n: number, paid: boolean) {
    const rows = buildSchedule(loan).map((r) => (r.n === n ? { ...r, paid } : r))
    await this.saveSchedule(loan, rows)
  },

  /** Records the next unpaid instalment as paid. */
  async recordEmi(loan: Loan) {
    const rows = buildSchedule(loan)
    const next = rows.find((r) => !r.paid)
    if (next) await this.setInstallmentPaid(loan, next.n, true)
  },

  /** Goes back to a schedule worked out from the loan's numbers (rate, EMI, EMIs paid). */
  async recalculateSchedule(loan: Loan) {
    const paidCount = buildSchedule(loan).filter((r) => r.paid).length
    await this.update(loan, { schedule: null, emisPaid: paidCount })
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

export const budgetItemRepo = {
  async add(input: { name: string; amount: number; categoryIds: string[] }) {
    const { data: last } = await supabase
      .from('budget_items')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>()
    const base = {
      id: generateId(),
      name: input.name,
      amount: input.amount,
      category_id: input.categoryIds[0] ?? null,
      sort_order: (last?.sort_order ?? -1) + 1,
    }
    let { error } = await supabase.from('budget_items').insert({ ...base, category_ids: input.categoryIds })
    // Database not updated yet for several categories: save with the first one only.
    if (error && input.categoryIds.length <= 1) ({ error } = await supabase.from('budget_items').insert(base))
    if (error) throw error
  },

  async update(id: string, changes: { name?: string; amount?: number; categoryIds?: string[] }) {
    const base = {
      ...(changes.name !== undefined ? { name: changes.name } : {}),
      ...(changes.amount !== undefined ? { amount: changes.amount } : {}),
      ...(changes.categoryIds ? { category_id: changes.categoryIds[0] ?? null } : {}),
    }
    let { error } = await supabase
      .from('budget_items')
      .update({ ...base, ...(changes.categoryIds ? { category_ids: changes.categoryIds } : {}) })
      .eq('id', id)
    if (error && (changes.categoryIds?.length ?? 0) <= 1) ({ error } = await supabase.from('budget_items').update(base).eq('id', id))
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('budget_items').delete().eq('id', id)
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
      'budget_items',
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
      'budget_items',
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
