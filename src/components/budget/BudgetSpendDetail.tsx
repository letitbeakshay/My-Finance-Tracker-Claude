import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, ChevronLeft, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { CategoryIcon } from '../ui/CategoryIcon'
import { useAllCategories, useExpenses } from '../../hooks/useLiveData'
import { formatCurrency } from '../../lib/currency'
import { formatMonthLabel } from '../../lib/analytics'
import { isSameMonth, parseISO as parse } from 'date-fns'
import { BUDGET_STATUS_COLOR } from '../../lib/budgets'

export interface BudgetDetailTarget {
  title: string
  categoryIds: string[]
  /** The limit for this budget, when it has one. */
  limit?: number
}

/** A full page listing everything spent against one budget this month, with a way back. */
export function BudgetSpendDetail({ target, month, onBack }: { target: BudgetDetailTarget; month: Date; onBack: () => void }) {
  const expenses = useExpenses()
  const categories = useAllCategories()
  const byId = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])

  const rows = useMemo(() => {
    const ids = new Set(target.categoryIds)
    return (expenses ?? [])
      .filter((e) => isSameMonth(parse(e.date), month) && (ids.has(e.categoryId) || ids.has(byId.get(e.categoryId)?.parentId ?? '')))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  }, [expenses, byId, target, month])

  const spent = rows.reduce((s, e) => s + e.amount, 0)
  const limit = target.limit
  const left = limit !== undefined ? limit - spent : undefined
  const over = left !== undefined && left < 0
  const pct = limit ? Math.min(100, (spent / limit) * 100) : 0
  const color = over ? BUDGET_STATUS_COLOR.over : pct >= 80 ? BUDGET_STATUS_COLOR.warning : BUDGET_STATUS_COLOR.ok

  return (
    <div className="max-w-[760px]">
      <button
        type="button"
        onClick={onBack}
        className="h-11 pl-2 pr-4 -ml-2 mb-3 rounded-xl flex items-center gap-1 text-secondary text-[15px] font-medium"
      >
        <ChevronLeft size={20} /> Back to budgets
      </button>

      <Card>
        <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">{formatMonthLabel(month)}</p>
        <h2 className="text-white text-[22px] font-bold mt-0.5">{target.title}</h2>
        <p className="text-white text-[28px] font-bold tabular-nums mt-3 leading-none">
          {formatCurrency(spent)}
          {limit !== undefined && <span className="text-tertiary text-[15px] font-medium"> of {formatCurrency(limit)}</span>}
        </p>
        {limit !== undefined && (
          <>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden mt-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p className="text-[13px] font-medium mt-2 tabular-nums" style={{ color }}>
              {over ? `${formatCurrency(-left!)} over your limit` : `${formatCurrency(left!)} left`}
            </p>
          </>
        )}
      </Card>

      <Card padded={false} className="mt-5 overflow-hidden">
        <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide px-5 pt-4 pb-2">
          {rows.length} {rows.length === 1 ? 'expense' : 'expenses'}
        </p>
        {rows.length === 0 ? (
          <p className="text-secondary text-[15px] text-center py-12">Nothing spent here this month.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((e) => {
              const c = byId.get(e.categoryId)
              return (
                <div key={e.id} className="px-5 py-3.5 flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                    {c && <CategoryIcon category={c} size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-white text-[15px] font-medium">
                      <span className="truncate">{e.notes || c?.name || 'Others'}</span>
                      {e.pleasesGod === true && <Check size={14} strokeWidth={2.6} className="text-positive shrink-0" aria-label="Pleases God" />}
                      {e.pleasesGod === false && <X size={14} strokeWidth={2.6} className="text-danger shrink-0" aria-label="Does not please God" />}
                    </span>
                    <span className="block text-tertiary text-[12px] truncate">
                      {format(parseISO(e.date), 'd MMM')} · {c?.name ?? 'Others'}
                    </span>
                  </span>
                  <span className="text-white text-[15px] font-bold tabular-nums shrink-0">{formatCurrency(e.amount)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
