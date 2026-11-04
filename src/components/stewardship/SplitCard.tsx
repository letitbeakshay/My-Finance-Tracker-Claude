import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import type { MonthPlan } from '../../lib/stewardship'

interface SplitCardProps {
  plan: MonthPlan
  givingPercent: number
  savingPercent: number
}

export function SplitCard({ plan, givingPercent, savingPercent }: SplitCardProps) {
  const rows = [
    { label: 'Give', amount: plan.given, pct: plan.givenPct, goal: givingPercent, color: '#e3b341' },
    { label: 'Save', amount: plan.saved, pct: plan.savedPct, goal: savingPercent, color: '#24d968' },
    {
      label: 'Live',
      amount: plan.lived,
      pct: plan.livedPct,
      goal: Math.max(0, 100 - givingPercent - savingPercent),
      color: '#5b9dff',
    },
  ]

  return (
    <Card>
      <h2 className="text-white text-[17px] font-bold">Give, save, live</h2>
      <p className="text-tertiary text-[12px] mb-4">Give first, save second, live on the rest</p>

      {plan.income > 0 ? (
        <div className="flex flex-col gap-4">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-white font-medium text-[15px]">{r.label}</span>
                <span className="text-white font-semibold text-[15px] tabular-nums">
                  {formatCurrency(r.amount)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-white/5 overflow-visible">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, r.pct)}%`, background: r.color }}
                />
                <div
                  className="absolute -top-1 w-0.5 h-4 bg-white/60 rounded"
                  style={{ left: `${Math.min(100, r.goal)}%` }}
                  aria-hidden
                />
              </div>
              <p className="text-tertiary text-[12px] mt-1.5">
                {r.pct}% of income · goal {r.goal}%
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-[14px]">No income recorded for this month yet.</p>
      )}
    </Card>
  )
}
