import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import { categoryPath } from '../../lib/categoryTree'
import { VERSES } from '../../lib/scripture'
import type { Category, Expense } from '../../types'

interface GodPleasingCardProps {
  /** The expenses of one month. */
  expenses: Expense[]
  categories: Category[]
}

/** How much of the month's spending you said pleased God, and what did not. */
export function GodPleasingCard({ expenses, categories }: GodPleasingCardProps) {
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const stats = useMemo(() => {
    const sum = (list: Expense[]) => list.reduce((s, e) => s + e.amount, 0)
    const yes = expenses.filter((e) => e.pleasesGod === true)
    const no = expenses.filter((e) => e.pleasesGod === false)
    const unanswered = expenses.filter((e) => e.pleasesGod === undefined)
    const answered = sum(yes) + sum(no)
    return {
      yes: sum(yes),
      no: sum(no),
      unanswered: sum(unanswered),
      pct: answered > 0 ? Math.round((sum(yes) / answered) * 100) : 0,
      answered,
      notPleasing: [...no].sort((a, b) => b.amount - a.amount).slice(0, 5),
    }
  }, [expenses])

  const total = stats.yes + stats.no + stats.unanswered

  return (
    <Card>
      <h2 className="text-white text-[17px] font-bold">Pleasing God</h2>
      <p className="text-tertiary text-[12px] mb-4">What you said about each expense this month</p>

      {total === 0 ? (
        <p className="text-secondary text-[14px]">No expenses this month yet.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-white text-[28px] font-bold tabular-nums leading-none">
              {stats.answered > 0 ? `${stats.pct}%` : '—'}
            </p>
            <p className="text-secondary text-[14px]">of answered spending pleased God</p>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden flex mb-3">
            <div className="h-full" style={{ width: `${(stats.yes / total) * 100}%`, background: 'var(--color-positive)' }} />
            <div className="h-full" style={{ width: `${(stats.no / total) * 100}%`, background: 'var(--color-danger)' }} />
          </div>
          <div className="flex flex-col gap-1.5 text-[13px]">
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-positive font-medium"><Check size={15} strokeWidth={2.6} /> Pleased God</span>
              <span className="text-white tabular-nums">{formatCurrency(stats.yes)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-danger font-medium"><X size={15} strokeWidth={2.6} /> Did not please God</span>
              <span className="text-white tabular-nums">{formatCurrency(stats.no)}</span>
            </p>
            {stats.unanswered > 0 && (
              <p className="flex items-center justify-between text-tertiary">
                <span>Not answered (older expenses)</span>
                <span className="tabular-nums">{formatCurrency(stats.unanswered)}</span>
              </p>
            )}
          </div>

          {stats.notPleasing.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide mb-2.5">To reflect on</p>
              <div className="flex flex-col gap-2.5">
                {stats.notPleasing.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="min-w-0">
                      <span className="block text-white truncate">{categoryPath(byId.get(e.categoryId), byId)}</span>
                      <span className="block text-tertiary text-[12px] truncate">
                        {format(parseISO(e.date), 'd MMM')}
                        {e.notes ? ` · ${e.notes}` : ''}
                      </span>
                    </span>
                    <span className="text-white font-semibold tabular-nums shrink-0">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-tertiary text-[12px] italic mt-4">
        “{VERSES.glory.text}” — {VERSES.glory.ref}
      </p>
    </Card>
  )
}
