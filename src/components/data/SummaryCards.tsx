import clsx from 'clsx'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { TrendHero } from '../ui/TrendHero'
import type { TrendPoint } from '../../lib/trend'
import { formatCurrency } from '../../lib/currency'

interface StatProps {
  label: string
  value: string
  sub?: string
  /** A thin bar under the number (0-100), with its caption. */
  bar?: { pct: number; caption: string; color?: string }
  tone?: 'default' | 'positive' | 'negative'
  className?: string
}

function Stat({ label, value, sub, bar, tone = 'default', className }: StatProps) {
  return (
    <Card className={clsx('!p-4 sm:!p-5 h-full justify-center', className)}>
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
      {bar && (
        <div className="mt-4">
          <Progress value={Math.max(0, Math.min(100, bar.pct))} height="h-1.5" indicatorColor={bar.color} />
          <p className="text-tertiary text-[12px] mt-1.5 truncate tabular-nums">{bar.caption}</p>
        </div>
      )}
    </Card>
  )
}

interface SummaryCardsProps {
  income: number
  expenses: number
  cardSpend: number
  /** Combined limit of the credit cards (0 when none is set). */
  cardLimit?: number
  youOwe: number
  /** Share of all borrowed money already paid back. */
  loanPaidPct?: number
  owedToYou: number
  /** Six months of income and spending for the chart. */
  incomeTrend: TrendPoint[]
  expenseTrend: TrendPoint[]
}

export function SummaryCards({ income, expenses, cardSpend, cardLimit = 0, youOwe, loanPaidPct, owedToYou, incomeTrend, expenseTrend }: SummaryCardsProps) {
  const net = income - expenses
  return (
    <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 lg:gap-4 mb-6 items-stretch">
      <TrendHero
        income={incomeTrend}
        expenses={expenseTrend}
        className="col-span-2 lg:col-span-1 lg:row-span-2"
        footer={
          <p className="mt-3 text-[13px] opacity-85">
            Kept this month <span className="font-semibold tabular-nums">{net < 0 ? '−' : ''}{formatCurrency(Math.abs(net))}</span>
          </p>
        }
      />
      <Stat
        label="Credit card spend"
        value={formatCurrency(cardSpend)}
        bar={cardLimit > 0 ? { pct: (cardSpend / cardLimit) * 100, caption: `${Math.round((cardSpend / cardLimit) * 100)}% of ${formatCurrency(cardLimit)} limit`, color: cardSpend / cardLimit > 0.8 ? 'var(--color-danger)' : undefined } : undefined}
      />
      <Stat
        label="Loans: you owe"
        value={formatCurrency(youOwe)}
        sub={owedToYou > 0 ? `${formatCurrency(owedToYou)} owed to you` : undefined}
        bar={youOwe > 0 && loanPaidPct != null ? { pct: loanPaidPct, caption: `${Math.round(loanPaidPct)}% paid off`, color: 'var(--color-want)' } : undefined}
      />
    </div>
  )
}
