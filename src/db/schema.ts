import type { Category, Expense, ExpenseType, PaymentMethod } from '../types'

/** Raw Postgres row shapes — snake_case, matching supabase/schema.sql. */
export interface ExpenseRow {
  id: string
  amount: number
  category_id: string
  type: ExpenseType
  payment_method: PaymentMethod
  notes: string | null
  date: string
  created_at: string
  updated_at: string
  recurring_id: string | null
  wallet_id: string | null
  source: string | null
  attachment_id: string | null
}

export interface CategoryRow {
  id: string
  name: string
  icon: string
  color: string | null
  archived: boolean
  wallet_id: string | null
  created_at: string
}

export interface AppSettingsRow {
  id: string
  currency: string
  onboarded_at: string | null
}

export function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    categoryId: row.category_id,
    type: row.type,
    paymentMethod: row.payment_method,
    notes: row.notes ?? undefined,
    date: row.date,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    recurringId: row.recurring_id ?? undefined,
    walletId: row.wallet_id ?? undefined,
    source: (row.source as Expense['source']) ?? 'manual',
    attachmentId: row.attachment_id ?? undefined,
  }
}

export function expenseToRow(
  expense: Omit<Expense, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number },
): Partial<ExpenseRow> {
  return {
    id: expense.id,
    amount: expense.amount,
    category_id: expense.categoryId,
    type: expense.type,
    payment_method: expense.paymentMethod,
    notes: expense.notes ?? null,
    date: expense.date,
    recurring_id: expense.recurringId ?? null,
    wallet_id: expense.walletId ?? null,
    source: expense.source ?? 'manual',
    attachment_id: expense.attachmentId ?? null,
  }
}

export function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color ?? undefined,
    archived: row.archived,
    walletId: row.wallet_id ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function categoryToRow(category: Omit<Category, 'createdAt'>): Partial<CategoryRow> {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color ?? null,
    archived: category.archived ?? false,
    wallet_id: category.walletId ?? null,
  }
}
