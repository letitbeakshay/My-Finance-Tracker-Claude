import { Card } from '../ui/Card'
import type { Category } from '../../types'
import { formatCurrency } from '../../lib/currency'

interface TopCategoriesProps {
  breakdown: { categoryId: string; amount: number }[]
  categoryMap: Map<string, Category>
}

export function TopCategories({ breakdown, categoryMap }: TopCategoriesProps) {
  if (breakdown.length === 0) return null
  const top = breakdown.slice(0, 5)

  return (
    <div className="mb-6">
      <h3 className="text-white text-[17px] font-bold mb-3">Top Spending Categories</h3>
      <div className="flex flex-col gap-2.5">
        {top.map((b, i) => {
          const category = categoryMap.get(b.categoryId)
          return (
            <Card key={b.categoryId} className="flex items-center gap-3.5" padded>
              <span className="text-tertiary text-[14px] font-bold w-4">{i + 1}</span>
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-lg shrink-0">
                {category?.icon ?? '📦'}
              </div>
              <span className="text-white text-[15px] font-medium flex-1 truncate">
                {category?.name ?? 'Others'}
              </span>
              <span className="text-white text-[15px] font-bold tabular-nums">
                {formatCurrency(b.amount)}
              </span>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
