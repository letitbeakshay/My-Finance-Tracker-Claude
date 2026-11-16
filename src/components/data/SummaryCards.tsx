import clsx from 'clsx'
import { Card } from '../ui/Card'
import { Hero, HeroPill } from '../ui/Hero'
import { Sparkline } from '../ui/Sparkline'
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
          tone === 'positive' && 'text-positive',
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
  /** Spending for each day of the month, for the line on the green panel. */
  daily?: number[]
  dailyLabels?: string[]
}

export function SummaryCards({ income, expenses, cardSpend, youOwe, owedToYou, daily, dailyLabels }: SummaryCardsProps) {
  const net = income - expenses
  const kept = income > 0 ? Math.round((net / income) * 100) : null
  return (
    <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 lg:gap-4 mb-6 items-stretch">
      <Hero
        label="Kept this month"
        value={net}
        pills={kept !== null && <HeroPill>{kept}% of income</HeroPill>}
        className="col-span-2 lg:col-span-1 lg:row-span-2"
      >
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-[12px] font-medium opacity-80">Income</p>
            <p className="text-[20px] font-bold tabular-nums mt-0.5">{formatCurrency(income)}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium opacity-80">Spent</p>
            <p className="text-[20px] font-bold tabular-nums mt-0.5">{formatCurrency(expenses)}</p>
          </div>
        </div>
        <Sparkline values={daily ?? []} labels={dailyLabels} />
      </Hero>
      <Stat label="Credit card spend" value={formatCurrency(cardSpend)} />
      <Stat
        label="Loans: you owe"
        value={formatCurrency(youOwe)}
        sub={owedToYou > 0 ? `${formatCurrency(owedToYou)} owed to you` : undefined}
      />
    </div>
  )
}
