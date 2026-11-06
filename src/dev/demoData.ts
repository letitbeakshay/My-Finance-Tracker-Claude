import { addDays, format, subDays } from 'date-fns'
import { CATEGORY_PLAN } from '../lib/categoryPlan'

/**
 * Dev-only sample data for previewing the app (`?demo` on the dev server).
 * Raw table rows, keyed by table name, so the same mappers as live data apply.
 */
const d = (daysAgo: number) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const now = new Date().toISOString()
const slug = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

type E = [id: string, amount: number, category: string, type: string, method: string, account: string | null, notes: string | null, daysAgo: number, pleasesGod: boolean]

const EXPENSES: E[] = [
  ['e1', 8500, 'tithe', 'giving', 'bank_transfer', 'acc2', 'Tithe to church', 3, true],
  ['e2', 22000, 'family-expenses', 'need', 'bank_transfer', 'acc2', 'Home allowance', 2, true],
  ['e3', 4200, 'grocery', 'need', 'credit_card', 'acc1', 'Groceries for Amma', 3, true],
  ['e4', 1800, 'outside-meal', 'want', 'upi', null, 'Dinner out', 1, false],
  ['e5', 640, 'coffee', 'want', 'upi', null, 'Cafe', 0, true],
  ['e6', 380, 'snacks', 'want', 'upi', null, 'Evening snacks', 0, false],
  ['e7', 1200, 'fuel', 'need', 'credit_card', 'acc1', null, 3, true],
  ['e8', 4999, 'shopping', 'want', 'credit_card', 'acc3', 'Headphones', 3, false],
  ['e9', 3200, 'record-reimbursable', 'need', 'credit_card', 'acc1', 'Team lunch for Record', 2, true],
  ['e10', 1450, 'record-reimbursable', 'need', 'upi', null, 'Cab to client', 1, true],
  ['e11', 10000, 'investment', 'savings', 'bank_transfer', 'acc2', 'SIP', 2, true],
  ['e12', 1000, 'helping-others', 'giving', 'upi', null, 'Food for the hungry', 1, true],
  ['e13', 299, 'recharge', 'need', 'upi', null, null, 0, true],
  ['e14', 10000, 'amma', 'need', 'bank_transfer', 'acc2', 'Amma allowance', 2, true],
]

export const DEMO_TABLES: Record<string, unknown[]> = {
  categories: CATEGORY_PLAN.flatMap((parent, i) => [
    {
      id: slug(parent.name), name: parent.name, icon: parent.icon, color: null, archived: false, sort_order: i, wallet_id: null,
      created_at: now, parent_id: null, reimbursable: !!parent.reimbursable, default_type: parent.defaultType,
    },
    ...(parent.children ?? []).map((c, j) => ({
      id: slug(c.name), name: c.name, icon: c.icon, color: null, archived: false, sort_order: j, wallet_id: null,
      created_at: now, parent_id: slug(parent.name), reimbursable: false, default_type: null,
    })),
  ]),
  payment_accounts: [
    { id: 'acc1', label: 'HDFC Regalia', type: 'credit_card', bank_name: 'HDFC', last4: '4821', icon: '💳', archived: false, sort_order: 0, created_at: now },
    { id: 'acc2', label: 'SBI Savings', type: 'bank_account', bank_name: 'SBI', last4: '6554', icon: '🏦', archived: false, sort_order: 1, created_at: now },
    { id: 'acc3', label: 'ICICI Amazon Pay', type: 'credit_card', bank_name: 'ICICI', last4: '1093', icon: '💳', archived: false, sort_order: 2, created_at: now },
  ],
  expenses: EXPENSES.map(([id, amount, category_id, type, payment_method, account_id, notes, ago, pleases_god]) => ({
    id, amount, category_id, type, payment_method, account_id, notes, date: d(ago),
    created_at: now, updated_at: now, recurring_id: null, wallet_id: null, source: 'manual', attachment_id: null,
    pleases_god, reimbursed: id === 'e10',
  })),
  incomes: [
    { id: 'i1', amount: 85000, source: 'Salary', account_id: 'acc2', notes: 'Monthly salary', date: d(3), created_at: now },
    { id: 'i2', amount: 12000, source: 'Freelance', account_id: null, notes: 'Logo project', date: d(1), created_at: now },
    { id: 'i3', amount: 1450, source: 'Interest', account_id: 'acc2', notes: null, date: d(0), created_at: now },
  ],
  loans: [
    { id: 'l1', name: 'Car loan — HDFC', kind: 'borrowed', principal: 640000, paid: 215000, emi: 14200, interest_rate: 9.5, tenure_months: 60, emis_paid: 18, next_due_date: format(addDays(new Date(), 6), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
    { id: 'l2', name: 'Laptop EMI', kind: 'borrowed', principal: 96000, paid: 72000, emi: 8000, next_due_date: format(addDays(new Date(), 12), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
    { id: 'l3', name: 'Lent to Ravi', kind: 'lent', principal: 25000, paid: 5000, emi: null, next_due_date: null, notes: null, closed: false, created_at: now },
  ],
  budgets: [
    { id: 'overall', category_id: null, monthly_limit: 60000, created_at: now },
    { id: 'eating-out', category_id: 'eating-out', monthly_limit: 3000, created_at: now },
    { id: 'shopping', category_id: 'shopping', monthly_limit: 5500, created_at: now },
    { id: 'fuel', category_id: 'fuel', monthly_limit: 3000, created_at: now },
    { id: 'family-support', category_id: 'family-support', monthly_limit: 30000, created_at: now },
  ],
  budget_items: [
    { id: 'bi1', name: 'PNB EMI', amount: 12000, category_id: null, sort_order: 0, created_at: now },
    { id: 'bi2', name: 'Phone EMI', amount: 3900, category_id: null, sort_order: 1, created_at: now },
    { id: 'bi3', name: 'Amma', amount: 10000, category_id: 'amma', sort_order: 2, created_at: now },
    { id: 'bi4', name: 'Fuel', amount: 3000, category_id: 'fuel', sort_order: 3, created_at: now },
    { id: 'bi5', name: 'Other My Expense', amount: 3000, category_id: 'other-expenses', sort_order: 4, created_at: now },
    { id: 'bi6', name: 'Insurance EMI', amount: 6800, category_id: null, sort_order: 5, created_at: now },
    { id: 'bi7', name: 'Aswathy Fees EMI', amount: 12000, category_id: null, sort_order: 6, created_at: now },
  ],
  reflections: [],
  app_settings: [
    { id: 'app', currency: '₹', onboarded_at: null, giving_percent: 10, saving_percent: 10, pause_threshold: 2000, giving_seeded: true },
  ],
}
