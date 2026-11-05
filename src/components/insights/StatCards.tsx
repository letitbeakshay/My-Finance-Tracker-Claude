import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'

interface StatCardsProps {
  total: number
  needs: number
  wants: number
  savings: number
  giving: number
}

export function StatCards({ total, needs, wants, savings, giving }: StatCardsProps) {
  const items = [
    { label: 'Total Spent', amount: total, color: 'var(--color-white)' },
    { label: 'Needs', amount: needs, color: 'var(--color-need)' },
    { label: 'Wants', amount: wants, color: 'var(--color-want)' },
    { label: 'Savings', amount: savings, color: 'var(--color-savings)' },
    { label: 'Giving', amount: giving, color: 'var(--color-giving)' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col gap-1.5">
          <p className="text-secondary text-[13px]">{item.label}</p>
          <p className="text-[21px] font-bold tabular-nums" style={{ color: item.color }}>
            {formatCurrency(item.amount)}
          </p>
        </Card>
      ))}
    </div>
  )
}
