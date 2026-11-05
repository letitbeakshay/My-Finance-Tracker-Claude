import { useMemo, useState } from 'react'
import { isSameMonth, parseISO } from 'date-fns'
import {
  useAllCategories,
  useAllPaymentAccounts,
  useBudgets,
  useExpenses,
  useIncomes,
  useLoans,
  useSettings,
} from '../../hooks/useLiveData'
import { INCOME_ICON } from '../../lib/dataIcons'
import { CategoryIcon } from '../ui/CategoryIcon'
import { formatMonthLabel } from '../../lib/analytics'
import { monthPlan } from '../../lib/stewardship'
import { EXPENSE_TYPE_COLORS as TYPE_COLOR, EXPENSE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense, Income, Loan } from '../../types'
import { TransactionSheet } from '../insights/TransactionSheet'
import { MonthNav } from '../ui/MonthNav'
import { FirstFruitsCard } from '../stewardship/FirstFruitsCard'
import { BudgetsView } from '../budget/BudgetsView'
import { BudgetProgressCard } from '../budget/BudgetProgressCard'
import { StewardshipView } from '../stewardship/StewardshipView'
import { SummaryCards } from './SummaryCards'
import {
  TransactionsPanel,
  type TransactionFilter,
  type TransactionRow,
} from './TransactionsPanel'
import { LoansPanel } from './LoansPanel'
import { AccountsPanel, type AccountSummary } from './AccountsPanel'
import { SectionNav, type Section } from './SectionNav'
import { AddIncomeSheet } from './AddIncomeSheet'
import { AddLoanSheet } from './AddLoanSheet'
import { IncomeSheet, LoanSheet } from './ManageSheets'

const INCOME_COLOR = '#66a7f6'

function inMonth(date: string, month: Date) {
  return isSameMonth(parseISO(date), month)
}

interface AllDataScreenProps {
  /** Opens the giving entry in the Enter expenses view, pre-filled with `amount`. */
  onGive: (amount: number) => void
}

export function AllDataScreen({ onGive }: AllDataScreenProps) {
  const expenses = useExpenses()
  const categories = useAllCategories()
  const accounts = useAllPaymentAccounts()
  const incomes = useIncomes()
  const loans = useLoans()
  const settings = useSettings()
  const budgets = useBudgets()

  const [month, setMonth] = useState(() => new Date())
  const [section, setSection] = useState<Section>('overview')
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [addingIncome, setAddingIncome] = useState(false)
  const [addingLoan, setAddingLoan] = useState(false)

  const categoryMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const accountMap = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts])

  const monthExpenses = useMemo(
    () => (expenses ?? []).filter((e) => inMonth(e.date, month)),
    [expenses, month],
  )
  const monthIncomes = useMemo(
    () => (incomes ?? []).filter((i) => inMonth(i.date, month)),
    [incomes, month],
  )

  const effectiveFilter: TransactionFilter =
    section === 'income' ? 'income' : section === 'expenses' ? 'expense' : filter

  const rows = useMemo(() => {
    const all: TransactionRow[] = []
    for (const e of monthExpenses) {
      const category = categoryMap.get(e.categoryId)
      all.push({
        key: `e:${e.id}`,
        kind: 'expense',
        date: e.date,
        createdAt: e.createdAt,
        icon: <CategoryIcon category={category ?? { id: e.categoryId, icon: '📦' }} size={20} />,
        title: category?.name ?? 'Others',
        note: e.notes,
        accountLabel: (e.accountId && accountMap.get(e.accountId)?.label) || PAYMENT_METHOD_LABELS[e.paymentMethod],
        tag: { label: EXPENSE_TYPE_LABELS[e.type], color: TYPE_COLOR[e.type] },
        amount: e.amount,
      })
    }
    for (const i of monthIncomes) {
      all.push({
        key: `i:${i.id}`,
        kind: 'income',
        date: i.date,
        createdAt: i.createdAt,
        icon: <INCOME_ICON size={20} className="text-positive" />,
        title: i.source,
        note: i.notes,
        accountLabel: (i.accountId && accountMap.get(i.accountId)?.label) || '—',
        tag: { label: 'Income', color: INCOME_COLOR },
        amount: i.amount,
      })
    }
    const q = search.trim().toLowerCase()
    return all
      .filter((r) => effectiveFilter === 'all' || r.kind === effectiveFilter)
      .filter((r) => !q || `${r.title} ${r.note ?? ''} ${r.accountLabel}`.toLowerCase().includes(q))
      .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
  }, [monthExpenses, monthIncomes, categoryMap, accountMap, effectiveFilter, search])

  const accountSummaries = useMemo<AccountSummary[]>(
    () =>
      (accounts ?? [])
        .filter((a) => !a.archived)
        .map((account) => ({
          account,
          spent: monthExpenses.filter((e) => e.accountId === account.id).reduce((s, e) => s + e.amount, 0),
          received: monthIncomes.filter((i) => i.accountId === account.id).reduce((s, i) => s + i.amount, 0),
        })),
    [accounts, monthExpenses, monthIncomes],
  )

  const plan = useMemo(
    () => (expenses && incomes && settings ? monthPlan(expenses, incomes, month, settings) : null),
    [expenses, incomes, settings, month],
  )

  if (!expenses || !incomes || !loans) return null

  const totalIncome = monthIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const cardSpend = accountSummaries
    .filter((s) => s.account.type === 'credit_card')
    .reduce((s, x) => s + x.spent, 0)
  const unassignedSpend = monthExpenses.filter((e) => !e.accountId).reduce((s, e) => s + e.amount, 0)
  const openLoans = loans.filter((l) => !l.closed)
  const youOwe = openLoans.filter((l) => l.kind === 'borrowed').reduce((s, l) => s + l.principal - l.paid, 0)
  const owedToYou = openLoans.filter((l) => l.kind === 'lent').reduce((s, l) => s + l.principal - l.paid, 0)

  function handleSelect(key: string) {
    const [kind, id] = [key.slice(0, 1), key.slice(2)]
    if (kind === 'e') setSelectedExpense(expenses?.find((e) => e.id === id) ?? null)
    else setSelectedIncome(incomes?.find((i) => i.id === id) ?? null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-32 md:pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <MonthNav month={month} onChange={setMonth} />

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setAddingIncome(true)}
            className="flex-1 sm:flex-none h-11 px-5 rounded-2xl bg-accent text-black text-[15px] font-semibold"
          >
            + Income
          </button>
          <button
            type="button"
            onClick={() => setAddingLoan(true)}
            className="flex-1 sm:flex-none h-11 px-5 rounded-2xl bg-surface border border-border text-white text-[15px] font-semibold"
          >
            + Loan
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 items-start">
        <SectionNav
          value={section}
          onChange={setSection}
          counts={{
            income: monthIncomes.length,
            expenses: monthExpenses.length,
            loans: openLoans.length,
          }}
        />

        <div className="min-w-0">
          {section === 'overview' && (
            <>
              {plan && settings && budgets && (
                <div className="grid gap-5 lg:gap-6 md:grid-cols-2 items-start mb-6">
                  <FirstFruitsCard plan={plan} givingPercent={settings.givingPercent} onGive={onGive} compact />
                  <BudgetProgressCard
                    budgets={budgets}
                    expenses={expenses}
                    categories={categories ?? []}
                    month={month}
                    onOpenBudgets={() => setSection('budgets')}
                  />
                </div>
              )}
              <SummaryCards
                income={totalIncome}
                expenses={totalExpenses}
                cardSpend={cardSpend}
                youOwe={youOwe}
                owedToYou={owedToYou}
              />
              <div className="flex flex-col gap-5 lg:gap-6">
                <TransactionsPanel
                  rows={rows}
                  filter={filter}
                  onFilter={setFilter}
                  search={search}
                  onSearch={setSearch}
                  onSelect={handleSelect}
                />
                <div className="grid gap-5 lg:gap-6 md:grid-cols-2 items-start">
                  <LoansPanel loans={loans} onAdd={() => setAddingLoan(true)} onSelect={setSelectedLoan} />
                  <AccountsPanel
                    summaries={accountSummaries}
                    unassignedSpend={unassignedSpend}
                    monthLabel={formatMonthLabel(month)}
                  />
                </div>
              </div>
            </>
          )}

          {section === 'budgets' && <BudgetsView month={month} />}

          {section === 'stewardship' && <StewardshipView month={month} onGive={onGive} />}

          {(section === 'transactions' || section === 'income' || section === 'expenses') && (
            <TransactionsPanel
              title={section === 'income' ? 'Income' : section === 'expenses' ? 'Expenses' : 'Transactions'}
              rows={rows}
              filter={effectiveFilter}
              onFilter={setFilter}
              search={search}
              onSearch={setSearch}
              onSelect={handleSelect}
              hideFilters={section !== 'transactions'}
            />
          )}

          {section === 'loans' && (
            <LoansPanel loans={loans} onAdd={() => setAddingLoan(true)} onSelect={setSelectedLoan} />
          )}

          {section === 'accounts' && (
            <AccountsPanel
              summaries={accountSummaries}
              unassignedSpend={unassignedSpend}
              monthLabel={formatMonthLabel(month)}
            />
          )}
        </div>
      </div>

      <TransactionSheet
        expense={selectedExpense}
        category={selectedExpense ? categoryMap.get(selectedExpense.categoryId) : undefined}
        account={selectedExpense?.accountId ? accountMap.get(selectedExpense.accountId) : undefined}
        onClose={() => setSelectedExpense(null)}
      />
      <IncomeSheet income={selectedIncome} onClose={() => setSelectedIncome(null)} />
      <LoanSheet loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
      <AddIncomeSheet
        open={addingIncome}
        onClose={() => setAddingIncome(false)}
        bankAccounts={(accounts ?? []).filter((a) => a.type === 'bank_account' && !a.archived)}
        givingPercent={settings?.givingPercent ?? 10}
        onGive={onGive}
      />
      <AddLoanSheet open={addingLoan} onClose={() => setAddingLoan(false)} />
    </div>
  )
}
