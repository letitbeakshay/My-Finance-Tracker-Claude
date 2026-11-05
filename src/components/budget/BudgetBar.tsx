import { formatCurrency } from '../../lib/currency'
import { BUDGET_STATUS_COLOR, type BudgetLine } from '../../lib/budgets'

/** Progress bar plus "spent of limit" caption for one budget line. */
export function BudgetBar({ line }: { line: BudgetLine }) {
  const color = BUDGET_STATUS_COLOR[line.status]
  return (
    <div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, line.pct)}%`, background: color }}
        />
      </div>
      <p className="text-[12px] mt-1.5 tabular-nums" style={{ color: line.status === 'ok' ? 'var(--color-tertiary)' : color }}>
        {formatCurrency(line.spent)} of {formatCurrency(line.limit)} ·{' '}
        {line.remaining >= 0
          ? `${formatCurrency(line.remaining)} left`
          : `${formatCurrency(-line.remaining)} over`}
      </p>
    </div>
  )
}
