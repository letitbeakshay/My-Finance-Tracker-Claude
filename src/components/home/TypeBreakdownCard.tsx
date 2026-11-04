import { Card } from '../ui/Card'
import { textShade } from '../../lib/colors'
import { formatCurrency } from '../../lib/currency'

interface TypeBreakdownCardProps {
  label: string
  icon: string
  amount: number
  percentage: number
  color: string
  softColor: string
}

export function TypeBreakdownCard({
  label,
  icon,
  amount,
  percentage,
  color,
  softColor,
}: TypeBreakdownCardProps) {
  return (
    <Card className="flex flex-col gap-3 flex-1" padded>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: softColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-secondary text-[13px] mb-0.5">{label}</p>
        <p className="text-white text-[19px] font-bold tabular-nums">{formatCurrency(amount)}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(percentage, 100)}%`, background: color }}
          />
        </div>
        <span className="text-[12px] font-medium" style={{ color: textShade(color) }}>
          {percentage}%
        </span>
      </div>
    </Card>
  )
}
