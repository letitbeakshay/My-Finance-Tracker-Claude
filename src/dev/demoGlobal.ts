import { addDays, format, subDays } from 'date-fns'
import { DEFAULT_PLAN } from '../lib/categoryPlan'
import { setCurrency } from '../lib/currency'

/**
 * Dev-only neutral sample data (`?demo=global` on the dev server), used for screenshots on the
 * landing page and in launch material: US dollars, the default categories every new account gets,
 * and generic account names. Never shipped to people who sign up.
 */
// `&cur=EUR` (or any code) shows the same sample in another currency, for screenshots.
setCurrency(new URLSearchParams(location.search).get('cur') || 'USD')

const d = (daysAgo: number) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const now = new Date().toISOString()
const slug = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

type E = [id: string, amount: number, category: string, type: string, method: string, account: string | null, notes: string | null, daysAgo: number, pleasesGod: boolean]

const EXPENSES: E[] = [
  ['e1', 320, 'tithe', 'giving', 'bank_transfer', 'acc2', 'Tithe', 3, true],
  ['e2', 1150, 'rent', 'need', 'bank_transfer', 'acc2', 'Rent', 4, true],
  ['e3', 86.4, 'groceries', 'need', 'debit_card', 'acc2', 'Weekly groceries', 3, true],
  ['e4', 42, 'restaurants', 'want', 'credit_card', 'acc1', 'Dinner out', 1, false],
  ['e5', 4.8, 'coffee-tea', 'want', 'debit_card', 'acc2', 'Coffee', 0, true],
  ['e6', 12.4, 'restaurants', 'want', 'debit_card', 'acc2', 'Lunch with team', 0, true],
  ['e7', 48, 'fuel', 'need', 'credit_card', 'acc1', null, 2, true],
  ['e8', 129, 'electronics', 'want', 'credit_card', 'acc1', 'Headphones', 5, false],
  ['e9', 64.2, 'groceries', 'need', 'debit_card', 'acc2', 'Groceries', 6, true],
  ['e10', 200, 'emergency-fund', 'savings', 'bank_transfer', 'acc2', 'Emergency fund', 2, true],
  ['e11', 40, 'charity', 'giving', 'cash', null, 'Food bank', 1, true],
  ['e12', 35, 'mobile-recharge', 'need', 'credit_card', 'acc1', 'Phone bill', 7, true],
  ['e13', 15.99, 'subscriptions', 'want', 'credit_card', 'acc1', 'Music', 8, true],
  ['e14', 72, 'electricity', 'need', 'bank_transfer', 'acc2', 'Electricity', 9, true],
]

const PAST: { id: string; amount: number; category_id: string; type: string; payment_method: string; account_id: string | null; notes: string; date: string }[] = []
const PAST_INCOME: unknown[] = []
// Five earlier months, so the six-month chart and quick add look like a lived-in account.
const MONTHLY: [number, string, string, string, string | null, string, number][] = [
  // amount, category, type, method, account, note, day of month
  [320, 'tithe', 'giving', 'bank_transfer', 'acc2', 'Tithe', 2],
  [1150, 'rent', 'need', 'bank_transfer', 'acc2', 'Rent', 1],
  [92, 'groceries', 'need', 'debit_card', 'acc2', 'Weekly groceries', 6],
  [78, 'groceries', 'need', 'debit_card', 'acc2', 'Weekly groceries', 13],
  [88, 'groceries', 'need', 'debit_card', 'acc2', 'Weekly groceries', 20],
  [4.8, 'coffee-tea', 'want', 'debit_card', 'acc2', 'Coffee', 9],
  [4.8, 'coffee-tea', 'want', 'debit_card', 'acc2', 'Coffee', 16],
  [12.4, 'restaurants', 'want', 'debit_card', 'acc2', 'Lunch with team', 11],
  [48, 'fuel', 'need', 'credit_card', 'acc1', 'Fuel', 8],
  [35, 'mobile-recharge', 'need', 'credit_card', 'acc1', 'Phone bill', 7],
  [200, 'emergency-fund', 'savings', 'bank_transfer', 'acc2', 'Emergency fund', 3],
]
const EXTRA_SPEND = [380, 90, 620, 240, 40] // a little variety month to month
for (let m = 1; m <= 5; m++) {
  const month = new Date()
  month.setDate(1)
  month.setMonth(month.getMonth() - m)
  const day = (n: number) => format(new Date(month.getFullYear(), month.getMonth(), n), 'yyyy-MM-dd')
  MONTHLY.forEach(([amount, cat, type, method, acc, note, dom], k) =>
    PAST.push({ id: `p${m}-${k}`, amount, category_id: cat, type, payment_method: method, account_id: acc, notes: note, date: day(dom) }),
  )
  PAST.push({ id: `p${m}-x`, amount: EXTRA_SPEND[m - 1], category_id: 'shopping', type: 'want', payment_method: 'credit_card', account_id: 'acc1', notes: 'Shopping', date: day(22) })
  PAST_INCOME.push({ id: `pi${m}`, amount: 3200, source: 'Salary', account_id: 'acc2', notes: 'Monthly pay', date: day(1), created_at: now })
}

export const GLOBAL_TABLES: Record<string, unknown[]> = {
  categories: DEFAULT_PLAN.flatMap((parent, i) => [
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
    { id: 'acc1', label: 'Visa card', type: 'credit_card', bank_name: null, last4: '4821', icon: 'i:card', archived: false, sort_order: 0, created_at: now },
    { id: 'acc2', label: 'Checking account', type: 'bank_account', bank_name: null, last4: '6554', icon: 'i:bank', archived: false, sort_order: 1, created_at: now },
  ],
  expenses: EXPENSES.map(([id, amount, category_id, type, payment_method, account_id, notes, ago, pleases_god]) => ({
    id, amount, category_id, type, payment_method, account_id, notes, date: d(ago),
    created_at: now, updated_at: now, recurring_id: null, wallet_id: null, source: 'manual', attachment_id: null,
    pleases_god, reimbursed: false, savings_plan_id: id === 'e10' ? 'sp1' : null,
  })).concat(
    PAST.map((r) => ({
      ...r, created_at: now, updated_at: now, recurring_id: null, wallet_id: null, source: 'manual', attachment_id: null,
      pleases_god: true, reimbursed: false, savings_plan_id: r.category_id === 'emergency-fund' ? 'sp1' : null,
    })),
  ),
  incomes: [
    { id: 'i1', amount: 3200, source: 'Salary', account_id: 'acc2', notes: 'Monthly pay', date: d(5), created_at: now },
    ...PAST_INCOME,
  ],
  loans: [
    { id: 'l1', name: 'Car loan', kind: 'borrowed', principal: 12000, paid: 5600, emi: 320, interest_rate: 6.5, tenure_months: 48, emis_paid: 17, next_due_date: format(addDays(new Date(), 6), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
    { id: 'l2', name: 'Credit card balance', kind: 'borrowed', principal: 1800, paid: 650, emi: 150, next_due_date: format(addDays(new Date(), 12), 'yyyy-MM-dd'), notes: null, closed: false, created_at: now },
  ],
  budgets: [
    { id: 'overall', category_id: null, monthly_limit: 2600, created_at: now },
    { id: 'groceries', category_id: 'groceries', monthly_limit: 400, created_at: now },
    { id: 'eating-out', category_id: 'eating-out', monthly_limit: 150, created_at: now },
  ],
  savings_plans: [
    { id: 'sp1', name: 'Emergency fund', kind: 'emergency', institution: null, account_id: 'acc2', target: 6000, monthly: 200, opening: 2400, interest_rate: null, start_date: null, maturity_date: null, notes: null, closed: false, sort_order: 0, created_at: now },
    { id: 'sp2', name: 'Wedding fund', kind: 'goal', institution: null, account_id: null, target: 8000, monthly: 300, opening: 3100, interest_rate: null, start_date: null, maturity_date: null, notes: null, closed: false, sort_order: 1, created_at: now },
  ],
  budget_items: [
    { id: 'bi1', name: 'Tithe', amount: 320, category_id: 'tithe', recurring: true, start_month: null, end_month: null, sort_order: 0, created_at: now },
    { id: 'bi2', name: 'Rent', amount: 1150, category_id: 'rent', recurring: true, start_month: null, end_month: null, sort_order: 1, created_at: now },
    { id: 'bi3', name: 'Groceries', amount: 400, category_id: 'groceries', recurring: true, start_month: null, end_month: null, sort_order: 2, created_at: now },
    { id: 'bi4', name: 'Car loan', amount: 320, category_id: null, recurring: true, start_month: null, end_month: null, sort_order: 3, created_at: now },
    { id: 'bi5', name: 'Fuel', amount: 160, category_id: 'fuel', recurring: true, start_month: null, end_month: null, sort_order: 4, created_at: now },
    { id: 'bi6', name: 'Emergency fund', amount: 200, category_id: 'emergency-fund', recurring: true, start_month: null, end_month: null, sort_order: 5, created_at: now },
  ],
  reflections: [],
  app_settings: [
    { id: 'app', currency: 'USD', onboarded_at: null, giving_percent: 10, saving_percent: 10, pause_threshold: 100, giving_seeded: true },
  ],
}
