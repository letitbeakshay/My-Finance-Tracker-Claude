import { useMemo, useState } from 'react'
import { addMonths, isSameMonth, parseISO, subMonths } from 'date-fns'
import {
  useAllCategories,
  useAllPaymentAccounts,
  useExpenses,
  useIncomes,
  useLoans,
} from '../../hooks/useLiveData'
import { categoryIcon, INCOME_ICON } from '../../lib/dataIcons'
import { formatMonthLabel } from '../../lib/analytics'
import { EXPENSE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import type { Expense, Income, Loan } from '../../types'
import { TransactionSheet } from '../insights/TransactionSheet'
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
import { DEMO_INCOMES, DEMO_LOANS, demoExpenses } from '../../dev/demoData'

const TYPE_COLOR = { need: '#5b9dff', want: '#ff9f43', savings: '#24d968' } as const
const INCOME_COLOR = '#24d968'

const SHOW_DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

function inMonth(date: string, month: Date) {
  return isSameMonth(parseISO(date), month)
}

export function AllDataScreen() {
  const liveExpenses = useExpenses()
  const categories = useAllCategories()
  const accounts = useAllPaymentAccounts()
  const liveIncomes = useIncomes()
  const liveLoans = useLoans()
  const expenses = SHOW_DEMO && accounts ? demoExpenses(accounts) : liveExpenses
  const incomes = SHOW_DEMO ? DEMO_INCOMES : liveIncomes
  const loans = SHOW_DEMO ? DEMO_LOANS : liveLoans

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
      const CategoryIcon = categoryIcon(e.categoryId)
      all.push({
        key: `e:${e.id}`,
        kind: 'expense',
        date: e.date,
        createdAt: e.createdAt,
        icon: <CategoryIcon size={20} />,
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
        icon: <INCOME_ICON size={20} className="text-accent" />,
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

  const isCurrentMonth = isSameMonth(month, new Date())

  function handleSelect(key: string) {
    const [kind, id] = [key.slice(0, 1), key.slice(2)]
    if (kind === 'e') setSelectedExpense(expenses?.find((e) => e.id === id) ?? null)
    else setSelectedIncome(incomes?.find((i) => i.id === id) ?? null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="w-10 h-10 flex items-center justify-center text-tertiary hover:text-white"
            aria-label="Previous month"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[26px] font-bold tracking-tight min-w-[180px] text-center sm:text-left">
            {formatMonthLabel(month)}
          </h1>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={isCurrentMonth}
            className="w-10 h-10 flex items-center justify-center text-tertiary hover:text-white disabled:opacity-30"
            aria-label="Next month"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

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
      />
      <AddLoanSheet open={addingLoan} onClose={() => setAddingLoan(false)} />
    </div>
  )
}
