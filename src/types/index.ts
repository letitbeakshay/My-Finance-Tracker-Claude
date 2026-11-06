export type ExpenseType = 'need' | 'want' | 'savings' | 'giving'

export type PaymentMethod =
  | 'upi'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'bank_transfer'
  | 'wallet'

export interface Category {
  id: string
  name: string
  icon: string
  color?: string
  archived?: boolean
  createdAt: number
  /** Manual drag-to-reorder position; lower sorts first. */
  sortOrder?: number
  /** Reserved for future account/wallet scoping. */
  walletId?: string
  /** A sub-category sits under this top-level category (e.g. Coffee under Eating Out). */
  parentId?: string
  /** Spending here is paid back by someone else, so it is tracked apart from your own spending. */
  reimbursable?: boolean
  /** The type usually suggested for this category on the Type screen. */
  defaultType?: ExpenseType
}

export type PaymentAccountType = 'bank_account' | 'debit_card' | 'credit_card'

/** A specific bank account or credit card the user pays from/with —
 * distinct from PaymentMethod (the general channel: UPI/card/cash/etc). */
export interface PaymentAccount {
  id: string
  label: string
  type: PaymentAccountType
  bankName?: string
  last4?: string
  /** Credit cards: yearly interest rate in percent charged on unpaid balance. */
  interestRate?: number
  /** Credit cards: the spending limit on the card. */
  creditLimit?: number
  /** Credit cards: day of the month the bill is generated. */
  statementDay?: number
  /** Credit cards: day of the month the bill is due. */
  dueDay?: number
  icon: string
  archived?: boolean
  sortOrder?: number
  createdAt: number
}

/** Which PaymentMethod values can have a specific PaymentAccount attached. */
export const PAYMENT_METHOD_ACCOUNT_TYPE: Partial<Record<PaymentMethod, PaymentAccountType>> = {
  upi: 'bank_account',
  credit_card: 'credit_card',
  debit_card: 'debit_card',
  bank_transfer: 'bank_account',
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  type: ExpenseType
  paymentMethod: PaymentMethod
  /** Specific bank account / credit card used, when relevant to paymentMethod. */
  accountId?: string
  notes?: string
  /** Did this spending please God? undefined = not answered (older expenses). */
  pleasesGod?: boolean
  /** For reimbursable categories: has the money been paid back yet? */
  reimbursed?: boolean
  /** For savings: which savings plan this money went into. */
  savingsPlanId?: string
  /** The bank's own reference number when imported from a statement; used to spot duplicates. */
  bankRef?: string
  date: string // ISO date (yyyy-MM-dd), the "spent on" date
  createdAt: number
  updatedAt: number

  // --- Forward-compatible, unused-for-now fields ---
  /** Set when this expense was generated from a recurring template. */
  recurringId?: string
  /** Which wallet/account this belongs to (defaults to a single implicit wallet today). */
  walletId?: string
  /** Set when imported/matched from a bank/UPI SMS or OCR receipt. */
  source?: 'manual' | 'sms' | 'ocr' | 'bank_sync'
  /** Arbitrary receipt/attachment reference for future OCR support. */
  attachmentId?: string
}

export type SavingsKind = 'fd' | 'rd' | 'sip' | 'ppf' | 'gold' | 'chit' | 'emergency' | 'account' | 'other'

/** A place your savings go: an FD, an RD, a mutual fund SIP, an emergency fund… with a target to reach. */
export interface SavingsPlan {
  id: string
  name: string
  kind: SavingsKind
  /** Where it is kept: a bank, a post office, a fund house, a chit group… */
  institution?: string
  /** The bank account it is linked to, when it is one of your tracked accounts. */
  accountId?: string
  /** The amount you want to reach. */
  target?: number
  /** What you plan to put in every month. */
  monthly?: number
  /** What was already saved here before you started tracking. */
  opening: number
  interestRate?: number
  startDate?: string // ISO date
  maturityDate?: string // ISO date
  notes?: string
  closed: boolean
  createdAt: number
}

export interface Income {
  id: string
  amount: number
  source: string
  /** Bank account the money landed in, if tracked. */
  accountId?: string
  date: string // ISO date (yyyy-MM-dd)
  notes?: string
  bankRef?: string
  createdAt: number
}

export type LoanKind = 'borrowed' | 'lent'

/** Money borrowed from (`borrowed`) or lent to (`lent`) someone. */
/** One instalment of a repayment schedule. */
export interface Installment {
  /** Sr. no. in the lender's schedule (1, 2, 3…). */
  n: number
  date?: string // ISO date (yyyy-MM-dd)
  emi: number
  interest: number
  principal: number
  paid: boolean
}

export interface Loan {
  id: string
  name: string
  kind: LoanKind
  principal: number
  /** Amount repaid so far; outstanding = principal - paid. */
  paid: number
  emi?: number
  /** Yearly interest rate in percent. */
  interestRate?: number
  /** Total number of monthly instalments the loan was taken for. */
  tenureMonths?: number
  /** How many EMIs have been paid so far. */
  emisPaid: number
  /** The saved repayment schedule (uploaded from the lender, or ticked by hand). Worked out from the numbers above when empty. */
  schedule?: Installment[]
  nextDueDate?: string // ISO date (yyyy-MM-dd)
  notes?: string
  closed: boolean
  createdAt: number
}

/** A monthly spending limit: for one category, or `overall` (needs + wants). */
export interface Budget {
  /** 'overall' or the category id. */
  id: string
  categoryId?: string
  monthlyLimit: number
  createdAt: number
}

export const OVERALL_BUDGET_ID = 'overall'

/** One line of the monthly plan (PNB EMI ₹12,000, Fuel ₹3,000…). Their total is the overall monthly budget. */
export interface BudgetItem {
  id: string
  name: string
  amount: number
  /** Optional: the first category whose spending is shown against this line. */
  categoryId?: string
  /** Every category linked to this line (spending from all of them is added up). */
  categoryIds: string[]
  sortOrder: number
  createdAt: number
}

/** Placeholder shape for future recurring-expense automation. Not used yet. */
export interface RecurringExpense {
  id: string
  amount: number
  categoryId: string
  type: ExpenseType
  paymentMethod: PaymentMethod
  notes?: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  nextRunDate: string
  active: boolean
  createdAt: number
}

/** Placeholder shape for future multi-wallet/account support. Not used yet. */
export interface Wallet {
  id: string
  name: string
  icon?: string
  isDefault?: boolean
  createdAt: number
}

export interface AppSettings {
  id: 'app'
  currency: string
  onboardedAt?: number
  /** Share of income set aside to give first (tithe / first fruits), in percent. */
  givingPercent: number
  /** Share of income to save, in percent. */
  savingPercent: number
  /** A "want" at or above this amount prompts a pause to count the cost; 0 disables. */
  pauseThreshold: number
}

/** A month-end accountability reflection. `id` is the month, 'yyyy-MM'. */
export interface Reflection {
  id: string
  gratitude: string
  improve: string
  commitment: string
  updatedAt: number
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  upi: 'UPI',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
}

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  need: 'Need',
  want: 'Want',
  savings: 'Savings',
  giving: 'Giving',
}

export const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  need: 'var(--color-need)',
  want: 'var(--color-want)',
  savings: 'var(--color-savings)',
  giving: 'var(--color-giving)',
}
