import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  useExpenses,
  useAllCategories,
  useAllPaymentAccounts,
  useBudgets,
  useIncomes,
  useSettings,
} from '../../hooks/useLiveData'
import {
  filterByMonth,
  thisWeekSpending,
  todaySpending,
  typeBreakdown,
  sum,
} from '../../lib/analytics'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { TypeBreakdownCard } from './TypeBreakdownCard'
import { TransactionItem } from './TransactionItem'
import { EmptyState } from '../ui/EmptyState'
import { SettingsIcon } from '../ui/icons'
import { HandHeart, Target } from 'lucide-react'
import { FirstFruitsCard } from '../stewardship/FirstFruitsCard'
import { BudgetProgressCard } from '../budget/BudgetProgressCard'
import { monthPlan } from '../../lib/stewardship'
import { ReimbursementCard } from '../stewardship/ReimbursementCard'
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
  const budgets = useBudgets()
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
  const monthTotal = useMemo(() => sum(monthExpenses), [monthExpenses])
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
            className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
            aria-label="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <div className="mb-7">
        <p className="text-secondary text-[15px] mb-1">Today's Spending</p>
        <AnimatedNumber value={todayTotal} className="text-white text-[44px] font-bold leading-none tracking-tight tabular-nums" />
      </div>

      <div className="mb-8">
        <p className="text-secondary text-[15px] mb-1">This Month</p>
        <AnimatedNumber value={monthTotal} className="text-white text-[30px] font-bold leading-none tracking-tight tabular-nums" />
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
          icon="🙏"
          amount={breakdown.giving}
          percentage={breakdown.givingPct}
          color="#a47b22"
          softColor="rgba(164,123,34,0.16)"
        />
        <TypeBreakdownCard
          label="Needs"
          icon="🛒"
          amount={breakdown.needs}
          percentage={breakdown.needsPct}
          color="#4f6f8f"
          softColor="rgba(79,111,143,0.14)"
        />
        <TypeBreakdownCard
          label="Wants"
          icon="✨"
          amount={breakdown.wants}
          percentage={breakdown.wantsPct}
          color="#b8683a"
          softColor="rgba(184,104,58,0.14)"
        />
        <TypeBreakdownCard
          label="Savings"
          icon="💰"
          amount={breakdown.savings}
          percentage={breakdown.savingsPct}
          color="#3f7f80"
          softColor="rgba(63,127,128,0.14)"
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
