import clsx from 'clsx'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'

interface StatProps {
  label: string
  value: string
  sub?: string
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}

function Stat({ label, value, sub, tone = 'default', className }: StatProps) {
  return (
    <Card className={clsx('!p-4 sm:!p-5', className)}>
      <p className="text-secondary text-[13px] mb-1.5">{label}</p>
      <p
        className={clsx(
          'text-[24px] sm:text-[28px] font-bold leading-none tracking-tight tabular-nums truncate',
          tone === 'positive' && 'text-accent',
          tone === 'negative' && 'text-danger',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-tertiary text-[12px] mt-2 truncate">{sub}</p>}
    </Card>
  )
}

interface SummaryCardsProps {
  income: number
  expenses: number
  cardSpend: number
  youOwe: number
  owedToYou: number
}

export function SummaryCards({ income, expenses, cardSpend, youOwe, owedToYou }: SummaryCardsProps) {
  const net = income - expenses
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
      <Stat label="Income" value={formatCurrency(income)} tone="positive" />
      <Stat label="Expenses" value={formatCurrency(expenses)} />
      <Stat
        label="Net"
        value={`${net < 0 ? '−' : ''}${formatCurrency(Math.abs(net))}`}
        tone={net < 0 ? 'negative' : 'positive'}
        sub={income > 0 ? `${Math.round((net / income) * 100)}% of income kept` : undefined}
      />
      <Stat label="Credit card spend" value={formatCurrency(cardSpend)} />
      <Stat
        label="Loans — you owe"
        value={formatCurrency(youOwe)}
        sub={owedToYou > 0 ? `${formatCurrency(owedToYou)} owed to you` : undefined}
        className="col-span-2 lg:col-span-1"
      />
    </div>
  )
}
