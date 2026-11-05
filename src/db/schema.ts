import type {
  Category,
  Budget,
  BudgetItem,
  Expense,
  ExpenseType,
  Income,
  Loan,
  LoanKind,
  Reflection,
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
  // Absent until the categories-v2 migration in supabase/ has been run.
  pleases_god?: boolean | null
  reimbursed?: boolean | null
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
  // Absent until the categories-v2 migration in supabase/ has been run.
  parent_id?: string | null
  reimbursable?: boolean | null
  default_type?: ExpenseType | null
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
  // Absent until the stewardship migration in supabase/schema.sql has been run.
  giving_percent?: number
  saving_percent?: number
  pause_threshold?: number
  giving_seeded?: boolean
}

export interface ReflectionRow {
  id: string
  gratitude: string | null
  improve: string | null
  commitment: string | null
  updated_at: string
}

export function rowToReflection(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    gratitude: row.gratitude ?? '',
    improve: row.improve ?? '',
    commitment: row.commitment ?? '',
    updatedAt: new Date(row.updated_at).getTime(),
  }
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
    pleasesGod: row.pleases_god ?? undefined,
    reimbursed: row.reimbursed ?? false,
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
    // Only sent when set, so older databases (without these columns) keep working.
    ...(expense.pleasesGod !== undefined ? { pleases_god: expense.pleasesGod } : {}),
    ...(expense.reimbursed !== undefined ? { reimbursed: expense.reimbursed } : {}),
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
    parentId: row.parent_id ?? undefined,
    reimbursable: row.reimbursable ?? false,
    defaultType: row.default_type ?? undefined,
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
    ...(category.parentId !== undefined ? { parent_id: category.parentId } : {}),
    ...(category.reimbursable !== undefined ? { reimbursable: category.reimbursable } : {}),
    ...(category.defaultType !== undefined ? { default_type: category.defaultType } : {}),
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

export interface IncomeRow {
  id: string
  amount: number
  source: string
  account_id: string | null
  notes: string | null
  date: string
  created_at: string
}

export interface LoanRow {
  id: string
  name: string
  kind: LoanKind
  principal: number
  paid: number
  emi: number | null
  next_due_date: string | null
  notes: string | null
  closed: boolean
  created_at: string
}

export function rowToIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    amount: Number(row.amount),
    source: row.source,
    accountId: row.account_id ?? undefined,
    notes: row.notes ?? undefined,
    date: row.date,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function incomeToRow(income: Omit<Income, 'createdAt'>): Partial<IncomeRow> {
  return {
    id: income.id,
    amount: income.amount,
    source: income.source,
    account_id: income.accountId ?? null,
    notes: income.notes ?? null,
    date: income.date,
  }
}

export function rowToLoan(row: LoanRow): Loan {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    principal: Number(row.principal),
    paid: Number(row.paid),
    emi: row.emi == null ? undefined : Number(row.emi),
    nextDueDate: row.next_due_date ?? undefined,
    notes: row.notes ?? undefined,
    closed: row.closed,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function loanToRow(loan: Omit<Loan, 'createdAt'>): Partial<LoanRow> {
  return {
    id: loan.id,
    name: loan.name,
    kind: loan.kind,
    principal: loan.principal,
    paid: loan.paid,
    emi: loan.emi ?? null,
    next_due_date: loan.nextDueDate ?? null,
    notes: loan.notes ?? null,
    closed: loan.closed,
  }
}

export interface BudgetRow {
  id: string
  category_id: string | null
  monthly_limit: number
  created_at: string
}

export function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id ?? undefined,
    monthlyLimit: Number(row.monthly_limit),
    createdAt: new Date(row.created_at).getTime(),
  }
}

export interface BudgetItemRow {
  id: string
  name: string
  amount: number
  category_id: string | null
  sort_order: number
  created_at: string
}

export function rowToBudgetItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    categoryId: row.category_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  }
}
