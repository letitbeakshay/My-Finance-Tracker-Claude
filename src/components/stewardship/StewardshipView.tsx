import { useMemo } from 'react'
import { format } from 'date-fns'
import { useExpenses, useIncomes, useLoans, useReflections, useSettings } from '../../hooks/useLiveData'
import { debtSummary, monthPlan } from '../../lib/stewardship'
import { verseOfTheDay } from '../../lib/scripture'
import { VerseCard } from './VerseCard'
import { FirstFruitsCard } from './FirstFruitsCard'
import { SplitCard } from './SplitCard'
import { DebtCard } from './DebtCard'
import { PlanCard } from './PlanCard'
import { ReflectionCard } from './ReflectionCard'

interface StewardshipViewProps {
  month: Date
  onGive: (amount: number) => void
}

/** The full stewardship picture for one month. Loads its own data. */
export function StewardshipView({ month, onGive }: StewardshipViewProps) {
  const expenses = useExpenses()
  const incomes = useIncomes()
  const loans = useLoans()
  const settings = useSettings()
  const reflections = useReflections()

  const plan = useMemo(
    () => (expenses && incomes && settings ? monthPlan(expenses, incomes, month, settings) : null),
    [expenses, incomes, settings, month],
  )
  const debt = useMemo(() => debtSummary(loans ?? []), [loans])

  if (!plan || !settings) return null

  const monthId = format(month, 'yyyy-MM')

  return (
    <div className="flex flex-col gap-5">
      <VerseCard verse={verseOfTheDay()} />
      <div className="grid gap-5 md:grid-cols-2 items-start">
        <FirstFruitsCard plan={plan} givingPercent={settings.givingPercent} onGive={onGive} />
        <SplitCard plan={plan} givingPercent={settings.givingPercent} savingPercent={settings.savingPercent} />
        <DebtCard summary={debt} />
        <PlanCard settings={settings} />
      </div>
      <ReflectionCard
        key={monthId}
        month={month}
        plan={plan}
        owed={debt.owed}
        reflection={reflections?.find((r) => r.id === monthId)}
      />
    </div>
  )
}
