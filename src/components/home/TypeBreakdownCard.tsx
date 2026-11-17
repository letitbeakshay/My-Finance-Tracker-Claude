import type { ReactNode } from 'react'
import { Card } from '../ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '../../lib/currency'

interface TypeBreakdownCardProps {
  label: string
  icon: ReactNode
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
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: softColor, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-secondary text-[13px] mb-0.5">{label}</p>
        <p className="text-white text-[19px] font-bold tabular-nums">{formatCurrency(amount)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={Math.max(0, Math.min(100, Math.min(percentage, 100)))} height="h-1.5" indicatorColor={color} className="flex-1" />
        <span className="text-[12px] font-medium" style={{ color }}>
          {percentage}%
        </span>
      </div>
    </Card>
  )
}
