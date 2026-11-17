import { useState, type ReactNode } from 'react'
import { ArrowDownLeft, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Money } from './Money'
import { TrendChart } from './TrendChart'
import { changePct, type TrendPoint } from '../../lib/trend'

/**
 * The home panel from the reference: a glass Income / Expenses switch, the big amount with light decimals,
 * a "this month" change pill, and the area chart with a black bubble. `footer` sits under the chart.
 */
export function TrendHero({
  income,
  expenses,
  footer,
  className,
}: {
  /** Six months of income and spending, oldest first, ending with the month being looked at. */
  income: TrendPoint[]
  expenses: TrendPoint[]
  footer?: ReactNode
  className?: string
}) {
  const [mode, setMode] = useState<'income' | 'expenses'>('expenses')
  const points = mode === 'income' ? income : expenses
  const [picked, setPicked] = useState<number | null>(null)
  const active = Math.min(picked ?? points.length - 1, points.length - 1)
  const change = changePct(points, active)
  const up = (change ?? 0) >= 0

  return (
    <div className={`hero rounded-card p-5 sm:p-6 shadow-card text-white ${className ?? ''}`} style={{ color: '#fff' }}>
      <div className="relative">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'income' | 'expenses'); setPicked(null) }}>
          <TabsList className="w-full h-12 border-0 bg-[rgba(255,255,255,0.16)] backdrop-blur-md p-1">
            <TabsTrigger value="income" className="text-[rgba(255,255,255,0.8)] data-active:bg-[rgba(255,255,255,0.3)] data-active:text-[#fff]">
              <ArrowDownLeft size={16} /> Income
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-[rgba(255,255,255,0.8)] data-active:bg-[rgba(255,255,255,0.3)] data-active:text-[#fff]">
              <ArrowUpRight size={16} /> Expenses
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-6">
          <Badge variant="glass" className="h-7">
            {change === null ? null : up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {change === null ? 'No earlier month' : `${Math.abs(change).toFixed(2)}%`}
            {change !== null && <span className="font-normal opacity-80">{active === points.length - 1 ? 'this month' : 'that month'}</span>}
          </Badge>
          <p className="mt-2 leading-none tracking-tight">
            <Money value={points[active].value} decimals className="text-[44px] sm:text-[52px] font-semibold tabular-nums" />
          </p>
        </div>

        <TrendChart points={points} active={active} onActive={setPicked} />
        {footer}
      </div>
    </div>
  )
}
