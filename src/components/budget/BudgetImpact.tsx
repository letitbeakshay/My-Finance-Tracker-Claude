import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react'
import { BUDGET_STATUS_COLOR, type BudgetLine } from '../../lib/budgets'
import { formatCurrency } from '../../lib/currency'

/** What a budget looks like if `amount` is added to it. */
export function afterAdding(line: BudgetLine, amount: number) {
  const usedPct = Math.min(100, (line.spent / line.limit) * 100)
  const addPct = Math.min(100 - usedPct, (amount / line.limit) * 100)
  const after = line.remaining - amount
  const status = after < 0 ? 'over' : (line.spent + amount) / line.limit >= 0.8 ? 'warning' : 'ok'
  return { usedPct, addPct, after, status } as const
}

const LABEL = { ok: 'Within budget', warning: 'Close to limit', over: 'Over budget' } as const
const ICON = { ok: CheckCircle2, warning: CircleAlert, over: AlertTriangle } as const

/** Status badge for a budget after adding `amount` to it. */
export function BudgetBadge({ line, amount }: { line: BudgetLine; amount: number }) {
  const { status } = afterAdding(line, amount)
  const color = BUDGET_STATUS_COLOR[status]
  const Icon = ICON[status]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <Icon size={12} strokeWidth={2.4} /> {LABEL[status]}
    </span>
  )
}

/**
 * The budget panel shown while adding an expense: a bar and one short line with what is used,
 * what is left now and what is left once this expense is added. The status badge sits in the card header.
 */
export function BudgetImpact({ line, amount }: { line: BudgetLine; amount: number }) {
  const { usedPct, addPct, after, status } = afterAdding(line, amount)
  const nowColor = BUDGET_STATUS_COLOR[line.status]
  const color = BUDGET_STATUS_COLOR[status]
  const leftNow = line.remaining >= 0 ? formatCurrency(line.remaining) : `${formatCurrency(-line.remaining)} over`

  return (
    <div className="mt-2">
      <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div className="h-full" style={{ width: `${usedPct}%`, background: nowColor }} />
        <div className="h-full" style={{ width: `${addPct}%`, background: color, opacity: 0.45 }} />
      </div>
      <p className="text-[12px] mt-1.5 tabular-nums text-tertiary leading-snug">
        <span className="text-white font-semibold">{formatCurrency(line.spent)}</span> of {formatCurrency(line.limit)} used · left now{' '}
        <span className="text-white font-semibold">{leftNow}</span> · after this {formatCurrency(amount)}{' '}
        <span className="font-semibold" style={{ color: status === 'ok' ? 'var(--color-white)' : color }}>
          {after >= 0 ? `${formatCurrency(after)} left` : `${formatCurrency(-after)} over`}
        </span>
      </p>
    </div>
  )
}
