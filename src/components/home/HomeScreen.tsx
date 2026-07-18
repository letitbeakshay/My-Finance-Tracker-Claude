import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useExpenses, useCategories, useAllPaymentAccounts } from '../../hooks/useLiveData'
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
import { TransactionSheet } from '../insights/TransactionSheet'
import type { Expense } from '../../types'

interface HomeScreenProps {
  onOpenSettings: () => void
  onAddExpense: () => void
}

export function HomeScreen({ onOpenSettings, onAddExpense }: HomeScreenProps) {
  const expenses = useExpenses()
  const categories = useCategories()
  const accounts = useAllPaymentAccounts()
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

  const monthExpenses = useMemo(
    () => filterByMonth(expenses ?? [], today),
    [expenses, today],
  )

  const breakdown = useMemo(() => typeBreakdown(monthExpenses), [monthExpenses])
  const todayTotal = useMemo(() => todaySpending(expenses ?? [], today), [expenses, today])
  const monthTotal = useMemo(() => sum(monthExpenses), [monthExpenses])
  const recent = useMemo(() => (expenses ?? []).slice(0, 8), [expenses])

  void thisWeekSpending

  if (!expenses) return null

  return (
    <div className="px-6 pt-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-bold leading-none tracking-tight">{format(today, 'MMMM yyyy')}</h1>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Settings"
        >
          <SettingsIcon />
        </button>
      </div>

      <div className="mb-7">
        <p className="text-secondary text-[15px] mb-1">Today's Spending</p>
        <AnimatedNumber value={todayTotal} className="text-white text-[44px] font-bold leading-none tracking-tight tabular-nums" />
      </div>

      <div className="mb-8">
        <p className="text-secondary text-[15px] mb-1">This Month</p>
        <AnimatedNumber value={monthTotal} className="text-white text-[30px] font-bold leading-none tracking-tight tabular-nums" />
      </div>

      <div className="flex gap-3 mb-9">
        <TypeBreakdownCard
          label="Needs"
          icon="🛒"
          amount={breakdown.needs}
          percentage={breakdown.needsPct}
          color="#5b9dff"
          softColor="rgba(91,157,255,0.14)"
        />
        <TypeBreakdownCard
          label="Wants"
          icon="✨"
          amount={breakdown.wants}
          percentage={breakdown.wantsPct}
          color="#ff9f43"
          softColor="rgba(255,159,67,0.14)"
        />
        <TypeBreakdownCard
          label="Savings"
          icon="💰"
          amount={breakdown.savings}
          percentage={breakdown.savingsPct}
          color="#24d968"
          softColor="rgba(36,217,104,0.14)"
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
