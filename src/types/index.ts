export type ExpenseType = 'need' | 'want' | 'savings'

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
  /** Reserved for future account/wallet scoping. */
  walletId?: string
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  type: ExpenseType
  paymentMethod: PaymentMethod
  notes?: string
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

/** Placeholder shape for a future income-tracking feature. Not used yet. */
export interface Income {
  id: string
  amount: number
  source: string
  date: string
  notes?: string
  walletId?: string
  createdAt: number
}

/** Placeholder shape for future budgeting feature. Not used yet. */
export interface Budget {
  id: string
  categoryId?: string
  type?: ExpenseType
  monthlyLimit: number
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
}
