import { Card } from '../ui/Card'
import type { Category, Expense } from '../../types'
import { formatCurrency } from '../../lib/currency'
import { regretExpenses } from '../../lib/analytics'

interface RegretListProps {
  expenses: Expense[]
  categoryMap: Map<string, Category>
  onSelect: (expense: Expense) => void
}

export function RegretList({ expenses, categoryMap, onSelect }: RegretListProps) {
  const regrets = regretExpenses(expenses)
  if (regrets.length === 0) return null

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-1">Things You May Regret</h3>
      <p className="text-secondary text-[13px] mb-3">Large "want" purchases this month</p>
      <div className="flex flex-col gap-2.5">
        {regrets.map((e) => {
          const category = categoryMap.get(e.categoryId)
          return (
            <Card
              key={e.id}
              className="flex items-center gap-3.5"
              padded
              onClick={() => onSelect(e)}
              style={{ cursor: 'pointer' }}
            >
              <div className="w-10 h-10 rounded-full bg-want-soft flex items-center justify-center text-lg shrink-0">
                {category?.icon ?? '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[15px] font-medium truncate">
                  {e.notes || category?.name || 'Purchase'}
                </p>
                <span className="text-want text-[12px] font-semibold">Want</span>
              </div>
              <span className="text-white text-[15px] font-bold tabular-nums">
                {formatCurrency(e.amount)}
              </span>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
