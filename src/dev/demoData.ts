import { addDays, format, subDays } from 'date-fns'
import { DEFAULT_CATEGORIES, GIVING_CATEGORIES } from '../db/seed'

/**
 * Dev-only sample data for previewing the app (`?demo` on the dev server).
 * Raw table rows, keyed by table name, so the same mappers as live data apply.
 */
const d = (daysAgo: number) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const now = new Date().toISOString()

type E = [id: string, amount: number, category: string, type: string, method: string, account: string | null, notes: string | null, daysAgo: number]

const EXPENSES: E[] = [
  ['e1', 8500, 'tithe', 'giving', 'bank_transfer', 'acc2', 'Tithe to church', 3],
  ['e2', 22000, 'rent', 'need', 'bank_transfer', 'acc2', 'Rent', 2],
  ['e3', 2310, 'bills', 'need', 'upi', null, 'Electricity', 2],
  ['e4', 4200, 'food', 'need', 'credit_card', 'acc1', 'Groceries', 3],
  ['e5', 1800, 'food', 'want', 'upi', null, 'Dinner out', 1],
  ['e6', 1200, 'fuel', 'need', 'credit_card', 'acc1', null, 3],
  ['e7', 1640, 'coffee', 'want', 'upi', null, 'Cafe', 0],
  ['e8', 4999, 'shopping', 'want', 'credit_card', 'acc3', 'Headphones', 3],
  ['e9', 950, 'entertainment', 'want', 'credit_card', 'acc1', 'Movie', 1],
  ['e10', 10000, 'investment', 'savings', 'bank_transfer', 'acc2', 'SIP', 2],
  ['e11', 1000, 'charity', 'giving', 'upi', null, 'Food for the hungry', 1],
  ['e12', 299, 'recharge', 'need', 'upi', null, null, 0],
]

export const DEMO_TABLES: Record<string, unknown[]> = {
  categories: [...DEFAULT_CATEGORIES, ...GIVING_CATEGORIES].map((c, i) => ({
    id: c.id, name: c.name, icon: c.icon, color: null, archived: false, sort_order: i, wallet_id: null, created_at: now,
  })),
  payment_accounts: [
    { id: 'acc1', label: 'HDFC Regalia', type: 'credit_card', bank_name: 'HDFC', last4: '4821', icon: '💳', archived: false, sort_order: 0, created_at: now },
    { id: 'acc2', label: 'SBI Savings', type: 'bank_account', bank_name: 'SBI', last4: '6554', icon: '🏦', archived: false, sort_order: 1, created_at: now },
    { id: 'acc3', label: 'ICICI Amazon Pay', type: 'credit_card', bank_name: 'ICICI', last4: '1093', icon: '💳', archived: false, sort_order: 2, created_at: now },
  ],
  expenses: EXPENSES.map(([id, amount, category_id, type, payment_method, account_id, notes, ago]) => ({
    id, amount, category_id, type, payment_method, account_id, notes, date: d(ago),
    created_at: now, updated_at: now, recurring_id: null, wallet_id: null, source: 'manual', attachment_id: null,
  })),
  incomes: [
    { id: 'i1', amount: 85000, source: 'Salary', account_id: 'acc2', notes: 'Monthly salary', date: d(3), created_at: now },
    { id: 'i2', amount: 12000, source: 'Freelance', account_id: null, notes: 'Logo project', date: d(1), created_at: now },
    { id: 'i3', amount: 1450, source: 'Interest', account_id: 'acc2', notes: null, date: d(0), created_at: now },
  ],
  loans: [
    { id: 'l1', name: 'Car loan — HDFC', kind: 'borrowed', principal: 640000, paid: 215000, emi: 14200, next_due_date: format(addDays(new Date(), 6), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
    { id: 'l2', name: 'Laptop EMI', kind: 'borrowed', principal: 96000, paid: 72000, emi: 8000, next_due_date: format(addDays(new Date(), 12), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
    { id: 'l3', name: 'Lent to Ravi', kind: 'lent', principal: 25000, paid: 5000, emi: null, next_due_date: null, notes: null, closed: false, created_at: now },
  ],
  budgets: [
    { id: 'overall', category_id: null, monthly_limit: 45000, created_at: now },
    { id: 'food', category_id: 'food', monthly_limit: 7000, created_at: now },
    { id: 'coffee', category_id: 'coffee', monthly_limit: 1500, created_at: now },
    { id: 'shopping', category_id: 'shopping', monthly_limit: 5500, created_at: now },
    { id: 'fuel', category_id: 'fuel', monthly_limit: 3000, created_at: now },
    { id: 'entertainment', category_id: 'entertainment', monthly_limit: 2000, created_at: now },
  ],
  reflections: [],
  app_settings: [
    { id: 'app', currency: '₹', onboarded_at: null, giving_percent: 10, saving_percent: 10, pause_threshold: 2000, giving_seeded: true },
  ],
}
