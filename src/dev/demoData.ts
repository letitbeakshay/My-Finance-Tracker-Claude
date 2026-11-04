import { format, subDays, addDays } from 'date-fns'
import type { Expense, Income, Loan, PaymentAccount } from '../types'

/** Dev-only sample data for previewing the All data view (`?demo` on the dev server). */
const d = (offset: number) => format(subDays(new Date(), offset), 'yyyy-MM-dd')

export const DEMO_INCOMES: Income[] = [
  { id: 'di1', amount: 85000, source: 'Salary', date: d(3), notes: 'Monthly salary', createdAt: 3 },
  { id: 'di2', amount: 12000, source: 'Freelance', date: d(1), notes: 'Logo project', createdAt: 2 },
  { id: 'di3', amount: 1450, source: 'Interest', date: d(0), createdAt: 1 },
]

export const DEMO_LOANS: Loan[] = [
  {
    id: 'dl1',
    name: 'Car loan — HDFC',
    kind: 'borrowed',
    principal: 640000,
    paid: 215000,
    emi: 14200,
    nextDueDate: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
    closed: false,
    createdAt: 3,
  },
  {
    id: 'dl2',
    name: 'Laptop EMI',
    kind: 'borrowed',
    principal: 96000,
    paid: 72000,
    emi: 8000,
    nextDueDate: format(addDays(new Date(), 12), 'yyyy-MM-dd'),
    closed: false,
    createdAt: 2,
  },
  { id: 'dl3', name: 'Lent to Ravi', kind: 'lent', principal: 25000, paid: 5000, closed: false, createdAt: 1 },
]

/** Sample expenses spread across the user's real accounts (by position). */
export function demoExpenses(accounts: PaymentAccount[]): Expense[] {
  const acc = (i: number) => accounts[i % Math.max(accounts.length, 1)]?.id
  const rows: [number, string, Expense['type'], Expense['paymentMethod'], number | null, string][] = [
    [0, 'coffee', 'want', 'upi', null, 'Morning latte'],
    [0, 'food', 'need', 'credit_card', 0, 'Lunch with team'],
    [1, 'fuel', 'need', 'credit_card', 1, ''],
    [1, 'shopping', 'want', 'credit_card', 2, 'Headphones'],
    [2, 'rent', 'need', 'bank_transfer', 1, 'November rent'],
    [2, 'bills', 'need', 'upi', null, 'Electricity'],
    [3, 'investment', 'savings', 'bank_transfer', 1, 'SIP'],
    [3, 'entertainment', 'want', 'credit_card', 0, 'Movie night'],
    [3, 'recharge', 'need', 'upi', null, ''],
  ]
  const amounts = [180, 640, 1200, 4999, 22000, 2310, 10000, 950, 299]
  return rows.map(([off, categoryId, type, paymentMethod, accIdx, notes], i) => ({
    id: `de${i}`,
    amount: amounts[i],
    categoryId,
    type,
    paymentMethod,
    accountId: accIdx == null ? undefined : acc(accIdx),
    notes: notes || undefined,
    date: d(off),
    createdAt: 100 - i,
    updatedAt: 100 - i,
  }))
}
