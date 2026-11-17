import { formatCurrency } from '../../lib/currency'
import { Progress } from '@/components/ui/progress'
import { BUDGET_STATUS_COLOR, type BudgetLine } from '../../lib/budgets'

/** Progress bar plus "spent of limit" caption for one budget line. */
export function BudgetBar({ line }: { line: BudgetLine }) {
  const color = BUDGET_STATUS_COLOR[line.status]
  return (
    <div>
      <Progress value={Math.max(0, Math.min(100, Math.min(100, line.pct)))} height="h-2" indicatorColor={color} />
      <p className="text-[12px] mt-1.5 tabular-nums" style={{ color: line.status === 'ok' ? 'var(--color-tertiary)' : color }}>
        {formatCurrency(line.spent)} of {formatCurrency(line.limit)} ·{' '}
        {line.remaining >= 0
          ? `${formatCurrency(line.remaining)} left`
          : `${formatCurrency(-line.remaining)} over`}
      </p>
    </div>
  )
}
