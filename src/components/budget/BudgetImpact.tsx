import clsx from 'clsx'
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

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <p className="text-tertiary text-[11px] font-medium">{label}</p>
      <p className="text-[15px] font-bold tabular-nums mt-0.5" style={{ color: color ?? 'var(--color-white)' }}>
        {value}
      </p>
    </div>
  )
}

/**
 * The budget panel shown while adding an expense: how much of the limit is used, how much is left now,
 * and what is left once this expense is added (or how far over it goes).
 */
export function BudgetImpact({ line, amount }: { line: BudgetLine; amount: number }) {
  const { usedPct, addPct, after, status } = afterAdding(line, amount)
  const nowColor = BUDGET_STATUS_COLOR[line.status]
  const color = BUDGET_STATUS_COLOR[status]
  const Icon = ICON[status]

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-white text-[14px] font-semibold tabular-nums">
          {formatCurrency(line.spent)}
          <span className="text-tertiary text-[12px] font-medium"> of {formatCurrency(line.limit)} used</span>
        </p>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
          style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          <Icon size={13} strokeWidth={2.4} /> {LABEL[status]}
        </span>
      </div>

      <div className="relative mt-2.5 h-2.5 rounded-full bg-white/5 overflow-hidden flex">
        <div className="h-full" style={{ width: `${usedPct}%`, background: nowColor }} />
        <div className="h-full" style={{ width: `${addPct}%`, background: color, opacity: 0.45 }} />
      </div>
      <p className="text-tertiary text-[11px] mt-1 flex justify-between">
        <span>Used</span>
        <span>This expense</span>
      </p>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <Stat
          label="Left now"
          value={line.remaining >= 0 ? formatCurrency(line.remaining) : `${formatCurrency(-line.remaining)} over`}
          color={line.remaining >= 0 ? undefined : nowColor}
        />
        <Stat
          label={`After this ${formatCurrency(amount)}`}
          value={after >= 0 ? `${formatCurrency(after)} left` : `${formatCurrency(-after)} over`}
          color={status === 'ok' ? undefined : color}
        />
      </div>

      {status !== 'ok' && (
        <p className={clsx('text-[12px] font-medium mt-2 leading-snug')} style={{ color }}>
          {status === 'over'
            ? `This puts you ${formatCurrency(-after)} over your limit.`
            : `You are about to hit your limit: only ${formatCurrency(after)} will be left.`}
        </p>
      )}
    </div>
  )
}
