import type {
  Category,
  Budget,
  BudgetItem,
  Installment,
  SavingsKind,
  SavingsPlan,
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
  // Absent until supabase/schema.sql has been applied (the app shows a banner when it has not).
  pleases_god?: boolean | null
  bank_ref?: string | null
  reimbursed?: boolean | null
  savings_plan_id?: string | null
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
  // Absent until supabase/schema.sql has been applied (the app shows a banner when it has not).
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
  interest_rate?: number | null
  credit_limit?: number | null
  statement_day?: number | null
  due_day?: number | null
  icon: string
  archived: boolean
  sort_order: number
  created_at: string
}

export interface AppSettingsRow {
  id: string
  currency: string
  onboarded_at: string | null
  // Absent until supabase/schema.sql has been applied (the app shows a banner when it has not).
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
    savingsPlanId: row.savings_plan_id ?? undefined,
    bankRef: row.bank_ref ?? undefined,
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
    ...(expense.bankRef ? { bank_ref: expense.bankRef } : {}),
    ...('savingsPlanId' in expense ? { savings_plan_id: expense.savingsPlanId ?? null } : {}),
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
    interestRate: row.interest_rate == null ? undefined : Number(row.interest_rate),
    creditLimit: row.credit_limit == null ? undefined : Number(row.credit_limit),
    statementDay: row.statement_day ?? undefined,
    dueDay: row.due_day ?? undefined,
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
    interest_rate: account.interestRate ?? null,
    credit_limit: account.creditLimit ?? null,
    statement_day: account.statementDay ?? null,
    due_day: account.dueDay ?? null,
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
  bank_ref?: string | null
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
  interest_rate?: number | null
  tenure_months?: number | null
  emis_paid?: number | null
  schedule?: Installment[] | null
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
    bankRef: row.bank_ref ?? undefined,
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
    ...(income.bankRef ? { bank_ref: income.bankRef } : {}),
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
    interestRate: row.interest_rate == null ? undefined : Number(row.interest_rate),
    tenureMonths: row.tenure_months == null ? undefined : Number(row.tenure_months),
    emisPaid: Number(row.emis_paid ?? 0),
    schedule: row.schedule?.length ? row.schedule : undefined,
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
    interest_rate: loan.interestRate ?? null,
    tenure_months: loan.tenureMonths ?? null,
    emis_paid: loan.emisPaid,
    schedule: loan.schedule ?? null,
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
  category_ids?: string[] | null
  recurring?: boolean | null
  start_month?: string | null
  end_month?: string | null
  sort_order: number
  created_at: string
}

export function rowToBudgetItem(row: BudgetItemRow): BudgetItem {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    categoryId: row.category_id ?? undefined,
    categoryIds: row.category_ids?.length ? row.category_ids : row.category_id ? [row.category_id] : [],
    recurring: row.recurring ?? true,
    startMonth: row.start_month ?? undefined,
    endMonth: row.end_month ?? undefined,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export interface SavingsPlanRow {
  id: string
  name: string
  kind: SavingsKind
  institution: string | null
  account_id: string | null
  target: number | null
  monthly: number | null
  opening: number
  interest_rate: number | null
  start_date: string | null
  maturity_date: string | null
  notes: string | null
  closed: boolean
  sort_order: number
  created_at: string
}

export function rowToSavingsPlan(row: SavingsPlanRow): SavingsPlan {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    institution: row.institution ?? undefined,
    accountId: row.account_id ?? undefined,
    target: row.target == null ? undefined : Number(row.target),
    monthly: row.monthly == null ? undefined : Number(row.monthly),
    opening: Number(row.opening ?? 0),
    interestRate: row.interest_rate == null ? undefined : Number(row.interest_rate),
    startDate: row.start_date ?? undefined,
    maturityDate: row.maturity_date ?? undefined,
    notes: row.notes ?? undefined,
    closed: row.closed,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export function savingsPlanToRow(plan: Omit<SavingsPlan, 'createdAt'>): Partial<SavingsPlanRow> {
  return {
    id: plan.id,
    name: plan.name,
    kind: plan.kind,
    institution: plan.institution ?? null,
    account_id: plan.accountId ?? null,
    target: plan.target ?? null,
    monthly: plan.monthly ?? null,
    opening: plan.opening,
    interest_rate: plan.interestRate ?? null,
    start_date: plan.startDate ?? null,
    maturity_date: plan.maturityDate ?? null,
    notes: plan.notes ?? null,
    closed: plan.closed,
  }
}
