import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import type { Loan } from '../../types'

interface LoansPanelProps {
  loans: Loan[]
  onAdd: () => void
  onSelect: (loan: Loan) => void
}

export function LoansPanel({ loans, onAdd, onSelect }: LoansPanelProps) {
  const sorted = [...loans].sort((a, b) => Number(a.closed) - Number(b.closed))

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-[19px] font-bold">Loans</h2>
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
          {sorted.map((loan) => {
            const pct = loan.principal > 0 ? Math.min(100, (loan.paid / loan.principal) * 100) : 0
            const color = loan.kind === 'borrowed' ? '#e39a5c' : '#66a7f6'
            return (
              <button
                key={loan.id}
                type="button"
                onClick={() => onSelect(loan)}
                className={clsx('text-left w-full', loan.closed && 'opacity-50')}
              >
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-white font-medium text-[15px] truncate">{loan.name}</span>
                  <span className="text-white font-semibold text-[15px] tabular-nums shrink-0">
                    {formatCurrency(loan.principal - loan.paid)}
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
                  {formatCurrency(loan.paid)} of {formatCurrency(loan.principal)} paid
                  {loan.emi ? ` · EMI ${formatCurrency(loan.emi)}` : ''}
                  {loan.nextDueDate && !loan.closed
                    ? ` · due ${format(parseISO(loan.nextDueDate), 'd MMM')}`
                    : ''}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
