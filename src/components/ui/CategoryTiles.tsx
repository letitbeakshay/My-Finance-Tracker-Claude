import { CategoryIcon } from './CategoryIcon'
import { Money } from './Money'
import type { Category } from '../../types'

export interface TileData {
  category: Category
  amount: number
}

/** Spending by category as soft two-column tiles, like the reference: name and icon on top, amount below. */
export function CategoryTiles({ tiles, onViewAll, title = 'Categories', limit = 6 }: { tiles: TileData[]; onViewAll?: () => void; title?: string; limit?: number }) {
  if (tiles.length === 0) return null
  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-white text-[18px] font-semibold">{title}</h2>
        {onViewAll && (
          <button type="button" onClick={onViewAll} className="text-tertiary text-[14px] font-medium h-9 px-1">
            View All
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.slice(0, limit).map(({ category, amount }) => (
          <div key={category.id} className="rounded-3xl bg-card border border-border/60 p-4 min-h-[112px] flex flex-col justify-between shadow-card">
            <div className="flex items-start justify-between gap-2">
              <span className="text-secondary text-[13px] leading-tight">{category.name}</span>
              <span className="text-tertiary shrink-0">
                <CategoryIcon category={category} size={20} />
              </span>
            </div>
            <Money value={amount} decimals className="text-white text-[22px] font-medium tabular-nums" />
          </div>
        ))}
      </div>
    </section>
  )
}
