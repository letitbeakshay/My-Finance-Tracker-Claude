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
    { label: 'Needs', amount: needs, color: '#66a7f6' },
    { label: 'Wants', amount: wants, color: '#e39a5c' },
    { label: 'Savings', amount: savings, color: '#4fc3d0' },
    { label: 'Giving', amount: giving, color: '#dcc25e' },
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
