import type {
  Category,
  Expense,
  ExpenseType,
  PaymentAccount,
  PaymentAccountType,
  PaymentMethod,
} from '../types'

/** Raw Postgres row shapes — snake_case, matching supabase/schema.sql. */
export interface ExpenseRow {
  id: string
  amount: number
  category_id: string
  type: ExpenseType
  payment_method: PaymentMethod
  account_id: string | null
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
  sort_order: number
  wallet_id: string | null
  created_at: string
}

export interface PaymentAccountRow {
  id: string
  label: string
  type: PaymentAccountType
  bank_name: string | null
  last4: string | null
  icon: string
  archived: boolean
  sort_order: number
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
    accountId: row.account_id ?? undefined,
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
    account_id: expense.accountId ?? null,
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
    sortOrder: row.sort_order,
    walletId: row.wallet_id ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function categoryToRow(
  category: Omit<Category, 'createdAt'>,
): Partial<CategoryRow> {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color ?? null,
    archived: category.archived ?? false,
    sort_order: category.sortOrder ?? 0,
    wallet_id: category.walletId ?? null,
  }
}

export function rowToPaymentAccount(row: PaymentAccountRow): PaymentAccount {
  return {
    id: row.id,
    label: row.label,
    type: row.type,
    bankName: row.bank_name ?? undefined,
    last4: row.last4 ?? undefined,
    icon: row.icon,
    archived: row.archived,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function paymentAccountToRow(
  account: Omit<PaymentAccount, 'createdAt'>,
): Partial<PaymentAccountRow> {
  return {
    id: account.id,
    label: account.label,
    type: account.type,
    bank_name: account.bankName ?? null,
    last4: account.last4 ?? null,
    icon: account.icon,
    archived: account.archived ?? false,
    sort_order: account.sortOrder ?? 0,
  }
}
