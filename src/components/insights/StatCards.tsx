import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'

interface StatCardsProps {
  total: number
  needs: number
  wants: number
  savings: number
}

export function StatCards({ total, needs, wants, savings }: StatCardsProps) {
  const items = [
    { label: 'Total Spent', amount: total, color: '#fff' },
    { label: 'Needs', amount: needs, color: '#5b9dff' },
    { label: 'Wants', amount: wants, color: '#ff9f43' },
    { label: 'Savings', amount: savings, color: '#2ecc71' },
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
