import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  useExpenses,
  useAllCategories,
  useAllPaymentAccounts,
  useEffectiveBudgets,
  useIncomes,
  useSettings,
} from '../../hooks/useLiveData'
import { formatCurrency } from '../../lib/currency'
import {
  filterByMonth,
  thisWeekSpending,
  todaySpending,
  typeBreakdown,
} from '../../lib/analytics'
import { TypeBreakdownCard } from './TypeBreakdownCard'
import { TransactionItem } from './TransactionItem'
import { EmptyState } from '../ui/EmptyState'
import { SettingsIcon } from '../ui/icons'
import { HandHeart, Target } from 'lucide-react'
import { FirstFruitsCard } from '../stewardship/FirstFruitsCard'
import { BudgetProgressCard } from '../budget/BudgetProgressCard'
import { monthPlan } from '../../lib/stewardship'
import { ReimbursementCard } from '../stewardship/ReimbursementCard'
import { ShoppingCart, Sparkles, PiggyBank } from 'lucide-react'
import { TrendHero } from '../ui/TrendHero'
import { CategoryTiles } from '../ui/CategoryTiles'
import { monthlyTrend } from '../../lib/trend'
import { categoryBreakdown } from '../../lib/analytics'
import { topLevelId } from '../../lib/categoryTree'
import { earnedOnly } from '../../lib/reimbursement'
import { QuickRepeat } from '../add/QuickRepeat'
import { parentMap } from '../../lib/categoryTree'
import { personalOnly, reimbursableIds } from '../../lib/reimbursement'
import { TransactionSheet } from '../insights/TransactionSheet'
import type { Expense } from '../../types'

interface HomeScreenProps {
  onOpenSettings: () => void
  onOpenStewardship: () => void
  onOpenBudgets: () => void
  onAddExpense: () => void
  onGive: (amount: number) => void
}

export function HomeScreen({
  onOpenSettings,
  onOpenStewardship,
  onOpenBudgets,
  onAddExpense,
  onGive,
}: HomeScreenProps) {
  const expenses = useExpenses()
  const categories = useAllCategories()
  const accounts = useAllPaymentAccounts()
  const budgets = useEffectiveBudgets()
  const incomes = useIncomes()
  const settings = useSettings()
  const [selected, setSelected] = useState<Expense | null>(null)
  const today = useMemo(() => new Date(), [])

  const categoryMap = useMemo(() => {
    const map = new Map((categories ?? []).map((c) => [c.id, c]))
    return map
  }, [categories])

  const accountMap = useMemo(() => {
    const map = new Map((accounts ?? []).map((a) => [a.id, a]))
    return map
  }, [accounts])

  const reimbursable = useMemo(() => reimbursableIds(categories ?? []), [categories])
  // Reimbursable spending is paid back, so it is left out of your own totals.
  const personal = useMemo(() => personalOnly(expenses ?? [], reimbursable), [expenses, reimbursable])

  const monthExpenses = useMemo(
    () => filterByMonth(personal, today),
    [personal, today],
  )

  const breakdown = useMemo(() => typeBreakdown(monthExpenses), [monthExpenses])
  const todayTotal = useMemo(() => todaySpending(personal, today), [personal, today])
  // Six months of income and spending for the chart, and this month's spending by category for the tiles.
  const incomeTrend = useMemo(() => monthlyTrend(earnedOnly(incomes ?? []), today), [incomes, today])
  const expenseTrend = useMemo(() => monthlyTrend(personal, today), [personal, today])
  const parents = useMemo(() => parentMap(categories ?? []), [categories])
  const categoryTiles = useMemo(() => {
    const merged = new Map<string, number>()
    for (const { categoryId, amount } of categoryBreakdown(monthExpenses)) {
      const top = topLevelId(categoryId, parents)
      merged.set(top, (merged.get(top) ?? 0) + amount)
    }
    return [...merged.entries()]
      .map(([id, amount]) => ({ category: categoryMap.get(id)!, amount }))
      .filter((t) => t.category)
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses, parents, categoryMap])
  const recent = useMemo(() => (expenses ?? []).slice(0, 8), [expenses])

  const plan = useMemo(
    () => (expenses && incomes && settings ? monthPlan(personal, incomes, today, settings) : null),
    [expenses, personal, incomes, settings, today],
  )

  void thisWeekSpending

  if (!expenses) return null

  return (
    <div className="px-6 pt-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[26px] font-bold leading-none tracking-tight whitespace-nowrap">{format(today, 'MMMM yyyy')}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenBudgets}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary"
            aria-label="Budgets"
          >
            <Target size={20} />
          </button>
          <button
            type="button"
            onClick={onOpenStewardship}
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-giving"
            aria-label="Stewardship"
          >
            <HandHeart size={20} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="fp-chip w-11 h-11 text-white active:scale-95 transition-transform duration-[var(--duration-quick)]"
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <QuickRepeat className="mb-7" />

      <TrendHero
        income={incomeTrend}
        expenses={expenseTrend}
        className="mb-7"
        footer={
          <p className="mt-3 text-[13px] opacity-85">
            Spent today <span className="font-semibold tabular-nums">{formatCurrency(todayTotal)}</span>
          </p>
        }
      />

      <div className="mb-8">
        <CategoryTiles tiles={categoryTiles} />
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {plan && settings && (
          <FirstFruitsCard plan={plan} givingPercent={settings.givingPercent} onGive={onGive} compact />
        )}
        {budgets && categories && (
          <BudgetProgressCard
            budgets={budgets}
            expenses={expenses}
            categories={categories}
            parents={parentMap(categories)}
            reimbursable={reimbursable}
            month={today}
            onOpenBudgets={onOpenBudgets}
          />
        )}
      </div>

      {categories && (
        <div className="mb-8 empty:hidden">
          <ReimbursementCard expenses={expenses} categories={categories} limit={3} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-9">
        <TypeBreakdownCard
          label="Giving"
          icon={<HandHeart size={20} />}
          amount={breakdown.giving}
          percentage={breakdown.givingPct}
          color="var(--color-giving)"
          softColor="var(--color-giving-soft)"
        />
        <TypeBreakdownCard
          label="Needs"
          icon={<ShoppingCart size={20} />}
          amount={breakdown.needs}
          percentage={breakdown.needsPct}
          color="var(--color-need)"
          softColor="var(--color-need-soft)"
        />
        <TypeBreakdownCard
          label="Wants"
          icon={<Sparkles size={20} />}
          amount={breakdown.wants}
          percentage={breakdown.wantsPct}
          color="var(--color-want)"
          softColor="var(--color-want-soft)"
        />
        <TypeBreakdownCard
          label="Savings"
          icon={<PiggyBank size={20} />}
          amount={breakdown.savings}
          percentage={breakdown.savingsPct}
          color="var(--color-savings)"
          softColor="var(--color-savings-soft)"
        />
      </div>

      <div>
        <h2 className="text-white text-[19px] font-bold mb-1">Recent Transactions</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="No expenses yet."
            actionLabel="Add First Expense"
            onAction={onAddExpense}
          />
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((e) => (
              <TransactionItem
                key={e.id}
                expense={e}
                category={categoryMap.get(e.categoryId)}
                account={e.accountId ? accountMap.get(e.accountId) : undefined}
                onClick={() => setSelected(e)}
              />
            ))}
          </div>
        )}
      </div>

      <TransactionSheet
        expense={selected}
        category={selected ? categoryMap.get(selected.categoryId) : undefined}
        account={selected?.accountId ? accountMap.get(selected.accountId) : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
