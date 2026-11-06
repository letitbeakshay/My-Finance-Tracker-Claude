import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import { loanStats } from '../../lib/loanMath'
import { DebtFreeCard } from './DebtFreeCard'
import type { Loan } from '../../types'

interface LoansPanelProps {
  loans: Loan[]
  onAdd: () => void
  onSelect: (loan: Loan) => void
}

export function LoansPanel({ loans, onAdd, onSelect }: LoansPanelProps) {
  // Snowball: the smallest balance is cleared first, so it comes first; closed loans go last.
  const rows = loans.map((loan) => ({ loan, stats: loanStats(loan) }))
  const open = rows.filter((r) => !r.loan.closed && r.loan.kind === 'borrowed').sort((a, b) => a.stats.outstanding - b.stats.outstanding)
  const rest = rows.filter((r) => !open.includes(r)).sort((a, b) => Number(a.loan.closed) - Number(b.loan.closed))
  const sorted = [...open, ...rest]
  const rank = new Map(open.map((r, i) => [r.loan.id, i + 1]))
  const first = open[0]

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white text-[19px] font-bold">Loans</h2>
          {open.length > 1 && <p className="text-tertiary text-[12px]">Snowball order: smallest balance first</p>}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-accent-ink text-[14px] font-semibold h-9 px-3 rounded-full bg-accent-soft"
        >
          + Add
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-secondary text-[14px] py-4 text-center">No loans tracked yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {first && open.length > 1 && first.stats.emi > 0 && (
            <p className="rounded-xl bg-accent-soft text-accent-ink text-[13px] font-medium px-3.5 py-2.5 leading-relaxed">
              Close <b>{first.loan.name}</b> first{first.stats.payoffDate ? ` (${format(parseISO(first.stats.payoffDate), 'MMM yyyy')})` : ''}, then add its {formatCurrency(Math.round(first.stats.emi))} EMI to the next loan.
            </p>
          )}
          {sorted.map(({ loan, stats }) => {
            const pct = loan.principal > 0 ? Math.min(100, (stats.principalPaid / loan.principal) * 100) : 0
            const color = loan.kind === 'borrowed' ? 'var(--color-want)' : 'var(--color-need)'
            return (
              <button
                key={loan.id}
                type="button"
                onClick={() => onSelect(loan)}
                className={clsx('text-left w-full', loan.closed && 'opacity-50')}
              >
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="flex items-center gap-2 min-w-0">
                    {rank.get(loan.id) && (
                      <span
                        className={clsx('w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center shrink-0', rank.get(loan.id) === 1 ? 'bg-positive text-on-type' : 'bg-surface border border-border text-secondary')}
                        title={rank.get(loan.id) === 1 ? 'Closes first' : `Closes number ${rank.get(loan.id)}`}
                      >
                        {rank.get(loan.id)}
                      </span>
                    )}
                    <span className="text-white font-medium text-[15px] truncate">{loan.name}</span>
                  </span>
                  <span className="text-white font-semibold text-[15px] tabular-nums shrink-0">
                    {formatCurrency(stats.outstanding)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden mb-1.5">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <p className="text-tertiary text-[12px]">
                  {loan.closed
                    ? 'Closed'
                    : loan.kind === 'borrowed'
                      ? 'You owe'
                      : 'Owed to you'}
                  {' · '}
                  {formatCurrency(stats.principalPaid)} of {formatCurrency(loan.principal)} paid
                  {loan.emi ? ` · EMI ${formatCurrency(loan.emi)}` : ''}
                  {loan.nextDueDate && !loan.closed
                    ? ` · due ${format(parseISO(loan.nextDueDate), 'd MMM')}`
                    : ''}
                  {!loan.closed && stats.payoffDate
                    ? ` · clears ${format(parseISO(stats.payoffDate), 'MMM yyyy')}${stats.remainingEmis != null ? ` (${stats.remainingEmis} EMIs left)` : ''}`
                    : ''}
                </p>
              </button>
            )
          })}
        </div>
      )}
      <DebtFreeCard open={open} />
    </Card>
  )
}
