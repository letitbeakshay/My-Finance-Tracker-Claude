import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import { PAYMENT_METHOD_ICONS } from '../../lib/paymentIcons'
import { PAYMENT_METHOD_LABELS } from '../../types'
import type { PaymentMethod } from '../../types'
import { CATEGORICAL_DARK } from '../../lib/chartPalette'

interface PaymentMethodChartProps {
  breakdown: { method: PaymentMethod; amount: number }[]
}

export function PaymentMethodChart({ breakdown }: PaymentMethodChartProps) {
  if (breakdown.length === 0) return null
  const max = Math.max(...breakdown.map((b) => b.amount)) || 1

  return (
    <Card className="mb-6">
      <h3 className="text-white text-[17px] font-bold mb-4">Payment Methods</h3>
      <div className="flex flex-col gap-4">
        {breakdown.map((b, i) => (
          <div key={b.method}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white text-[14px] font-medium">
                {PAYMENT_METHOD_ICONS[b.method]} {PAYMENT_METHOD_LABELS[b.method]}
              </span>
              <span className="text-secondary text-[13px] tabular-nums">
                {formatCurrency(b.amount)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(b.amount / max) * 100}%`,
                  background: CATEGORICAL_DARK[i % CATEGORICAL_DARK.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
