import { format, parseISO } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Card } from '../ui/card'
import { formatCurrency } from '../../lib/currency'
import { loanStats } from '../../lib/loanMath'
import { DebtFreeCard } from './DebtFreeCard'
import type { Loan } from '../../types'

interface LoansPanelProps {
  loans: Loan[]
  onAdd: () => void
  onSelect: (loan: Loan) => void
  /** Show the "Becoming debt-free" scripture and tips under the list (on the Loans page). */
  showDebtFree?: boolean
  /** Show only the first few loans, with a "View all" link (the Dashboard overview). */
  limit?: number
  onViewAll?: () => void
}

export function LoansPanel({ loans, onAdd, onSelect, showDebtFree, limit, onViewAll }: LoansPanelProps) {
  // Snowball: the smallest balance is cleared first, so it comes first; closed loans go last.
  const rows = loans.map((loan) => ({ loan, stats: loanStats(loan) }))
  const open = rows.filter((r) => !r.loan.closed && r.loan.kind === 'borrowed').sort((a, b) => a.stats.outstanding - b.stats.outstanding)
  const rest = rows.filter((r) => !open.includes(r)).sort((a, b) => Number(a.loan.closed) - Number(b.loan.closed))
  const sorted = [...open, ...rest]
  const shown = limit ? sorted.slice(0, limit) : sorted
  const more = limit ? Math.max(0, sorted.length - limit) : 0
  const rank = new Map(open.map((r, i) => [r.loan.id, i + 1]))
  const first = open[0]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-[16px] font-semibold">Loans</h2>
          {open.length > 1 && <p className="text-tertiary text-[12px]">Smallest balance first</p>}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-accent-ink text-[14px] font-semibold h-9 px-3.5 rounded-full bg-accent-soft transition-opacity duration-[var(--duration-quick)] hover:opacity-80"
        >
          + Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-secondary text-[14px] py-4 text-center">No loans tracked yet.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {first && open.length > 1 && first.stats.emi > 0 && (
            <p className="rounded-2xl bg-accent-soft text-accent-ink text-[13px] px-3.5 py-2.5 mb-2 leading-snug">
              Clear <b>{first.loan.name}</b> first
              {first.stats.payoffDate ? ` · by ${format(parseISO(first.stats.payoffDate), 'MMM yyyy')}` : ''}
              <span className="block opacity-80">Then roll its {formatCurrency(Math.round(first.stats.emi))} EMI into the next loan.</span>
            </p>
          )}
          {shown.map(({ loan, stats }) => {
            const pct = loan.principal > 0 ? Math.min(100, (stats.principalPaid / loan.principal) * 100) : 0
            const color = loan.kind === 'borrowed' ? 'var(--color-want)' : 'var(--color-need)'
            const meta = loan.closed
              ? ['Closed']
              : [
                  loan.kind === 'lent' ? 'Owed to you' : null,
                  loan.emi ? `EMI ${formatCurrency(loan.emi)}` : null,
                  loan.nextDueDate ? `Due ${format(parseISO(loan.nextDueDate), 'd MMM')}` : null,
                  stats.remainingEmis != null ? `${stats.remainingEmis} left` : null,
                ].filter(Boolean)
            return (
              <button
                key={loan.id}
                type="button"
                onClick={() => onSelect(loan)}
                className={clsx(
                  'text-left w-full rounded-2xl -mx-2 px-2 py-2.5 hover:bg-surface/70 transition-colors duration-[var(--duration-quick)]',
                  loan.closed && 'opacity-50',
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="flex items-center gap-2 min-w-0">
                    {rank.get(loan.id) && (
                      <span
                        className={clsx(
                          'w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0',
                          rank.get(loan.id) === 1 ? 'bg-positive text-on-type' : 'bg-surface border border-border text-secondary',
                        )}
                        title={rank.get(loan.id) === 1 ? 'Clear this first' : `Clear number ${rank.get(loan.id)}`}
                      >
                        {rank.get(loan.id)}
                      </span>
                    )}
                    <span className="text-white font-medium text-[15px] truncate">{loan.name}</span>
                  </span>
                  <span className="text-white font-semibold text-[15px] tabular-nums shrink-0">{formatCurrency(stats.outstanding)}</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, pct))} height="h-1.5" indicatorColor={color} />
                {meta.length > 0 && <p className="text-tertiary text-[12px] mt-1.5 tabular-nums">{meta.join(' · ')}</p>}
              </button>
            )
          })}
        </div>
      )}
      {more > 0 && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="mt-2 -mb-1 h-10 rounded-2xl text-[14px] font-semibold text-accent-ink hover:bg-surface/70 transition-colors duration-[var(--duration-quick)] flex items-center justify-center gap-1.5"
        >
          View all {sorted.length} <ChevronRight size={16} />
        </button>
      )}
      {showDebtFree && <DebtFreeCard open={open} />}
    </Card>
  )
}
