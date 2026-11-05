import { useMemo } from 'react'
import { ChevronRight, Target } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BudgetBar } from './BudgetBar'
import { budgetProgress } from '../../lib/budgets'
import { CategoryIcon } from '../ui/CategoryIcon'
import type { Budget, Category, Expense } from '../../types'

interface BudgetProgressCardProps {
  budgets: Budget[]
  expenses: Expense[]
  categories: Category[]
  month: Date
  onOpenBudgets: () => void
  /** How many category budgets to preview (most used first). */
  limit?: number
}

/** Dashboard summary of this month's budgets, with a way into the full Budgets page. */
export function BudgetProgressCard({
  budgets,
  expenses,
  categories,
  month,
  onOpenBudgets,
  limit = 4,
}: BudgetProgressCardProps) {
  const progress = useMemo(() => budgetProgress(budgets, expenses, month), [budgets, expenses, month])
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const hasBudgets = progress.overall !== null || progress.categories.length > 0

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-[17px] font-bold flex items-center gap-2">
          <Target size={18} className="text-accent-ink" /> Budgets
        </h2>
        {hasBudgets && (
          <button
            type="button"
            onClick={onOpenBudgets}
            className="text-accent-ink text-[14px] font-semibold flex items-center gap-0.5"
          >
            Manage <ChevronRight size={16} />
          </button>
        )}
      </div>

      {hasBudgets ? (
        <div className="flex flex-col gap-4">
          {progress.overall && (
            <div>
              <p className="text-white font-medium text-[15px] mb-1.5">Overall spending</p>
              <BudgetBar line={progress.overall} />
            </div>
          )}
          {progress.categories.slice(0, limit).map((b) => {
            const category = categoryMap.get(b.categoryId!)
            return (
              <div key={b.categoryId}>
                <p className="text-white font-medium text-[15px] mb-1.5 flex items-center gap-2">
                  <CategoryIcon category={category ?? { id: b.categoryId!, icon: '📦' }} size={16} className="text-secondary" />{' '}
                  {category?.name ?? 'Category'}
                </p>
                <BudgetBar line={b} />
              </div>
            )
          })}
          {progress.categories.length > limit && (
            <p className="text-tertiary text-[12px]">+{progress.categories.length - limit} more in Manage</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-secondary text-[14px] leading-relaxed mb-4">
            Plan before you spend. Set a monthly limit and watch your progress here.
          </p>
          <Button variant="secondary" onClick={onOpenBudgets}>
            Set up budgets
          </Button>
        </>
      )}
    </Card>
  )
}
