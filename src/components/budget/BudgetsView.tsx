import { useEffect, useMemo, useState } from 'react'
import { useBudgets, useCategories, useExpenses } from '../../hooks/useLiveData'
import { budgetRepo } from '../../db/repository'
import { budgetProgress } from '../../lib/budgets'
import { categoryIcon } from '../../lib/dataIcons'
import { VERSES } from '../../lib/scripture'
import { OVERALL_BUDGET_ID } from '../../types'
import { Card } from '../ui/Card'
import { BudgetBar } from './BudgetBar'

const FIELD =
  'w-28 h-11 bg-surface border border-border rounded-xl px-3 text-white text-[15px] text-right tabular-nums placeholder:text-tertiary'

function LimitInput({ value, onCommit }: { value?: number; onCommit: (limit: number) => Promise<void> }) {
  const [text, setText] = useState(value ? String(value) : '')
  const [error, setError] = useState(false)

  useEffect(() => {
    setText(value ? String(value) : '')
  }, [value])

  async function commit() {
    const next = parseFloat(text) || 0
    if (next === (value ?? 0)) return
    try {
      setError(false)
      await onCommit(next)
    } catch {
      setError(true)
    }
  }

  return (
    <div className="text-right shrink-0">
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        inputMode="decimal"
        placeholder="No limit"
        aria-label="Monthly limit"
        className={FIELD}
      />
      {error && <p className="text-danger text-[11px] mt-1">Not saved — run schema.sql</p>}
    </div>
  )
}

/** Set monthly limits, and see this month's progress against each. */
export function BudgetsView({ month }: { month: Date }) {
  const budgets = useBudgets()
  const expenses = useExpenses()
  const categories = useCategories()

  const progress = useMemo(
    () => (budgets && expenses ? budgetProgress(budgets, expenses, month) : null),
    [budgets, expenses, month],
  )
  if (!budgets || !expenses || !categories || !progress) return null

  // Giving is planned through the stewardship plan, not a spending limit.
  const spendCategories = categories.filter((c) => !['tithe', 'offering', 'missions', 'charity'].includes(c.id))
  const limitFor = (id: string) => budgets.find((b) => b.id === id)?.monthlyLimit
  const lineFor = (id: string) => progress.categories.find((l) => l.categoryId === id)

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <p className="text-tertiary text-[12px] italic">
          “{VERSES.diligent.text}” — {VERSES.diligent.ref}
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div>
            <h2 className="text-white text-[17px] font-bold">Overall monthly budget</h2>
            <p className="text-tertiary text-[12px]">Needs and wants together</p>
          </div>
          <LimitInput value={limitFor(OVERALL_BUDGET_ID)} onCommit={(n) => budgetRepo.set(null, n)} />
        </div>
        {progress.overall && (
          <div className="mt-3">
            <BudgetBar line={progress.overall} />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-white text-[17px] font-bold mb-1">By category</h2>
        <p className="text-tertiary text-[12px] mb-4">Leave blank for no limit</p>
        <div className="flex flex-col gap-5">
          {spendCategories.map((c) => {
            const Icon = categoryIcon(c.id)
            const line = lineFor(c.id)
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-white font-medium text-[15px] truncate">{c.name}</span>
                      {!line && (
                        <span className="block text-tertiary text-[12px] tabular-nums">
                          ₹{Math.round(progress.spentByCategory(c.id)).toLocaleString('en-IN')} spent this month
                        </span>
                      )}
                    </span>
                  </span>
                  <LimitInput value={limitFor(c.id)} onCommit={(n) => budgetRepo.set(c.id, n)} />
                </div>
                {line && (
                  <div className="mt-2.5">
                    <BudgetBar line={line} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
