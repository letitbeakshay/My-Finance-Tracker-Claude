import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useBudgets, useCategories, useExpenses } from '../../hooks/useLiveData'
import { budgetRepo } from '../../db/repository'
import { budgetProgress } from '../../lib/budgets'
import { VERSES } from '../../lib/scripture'
import { OVERALL_BUDGET_ID } from '../../types'
import { Card } from '../ui/Card'
import { CategoryIcon } from '../ui/CategoryIcon'
import { BudgetBar } from './BudgetBar'
import { AddBudgetSheet } from './AddBudgetSheet'

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

/** Set monthly limits for the budgets you add, and see this month's progress against each. */
export function BudgetsView({ month }: { month: Date }) {
  const budgets = useBudgets()
  const expenses = useExpenses()
  const categories = useCategories()
  const [adding, setAdding] = useState(false)

  const progress = useMemo(
    () => (budgets && expenses ? budgetProgress(budgets, expenses, month) : null),
    [budgets, expenses, month],
  )
  if (!budgets || !expenses || !categories || !progress) return null

  const limitFor = (id: string) => budgets.find((b) => b.id === id)?.monthlyLimit
  const lineFor = (id: string) => progress.categories.find((l) => l.categoryId === id)
  const budgetedIds = new Set(budgets.map((b) => b.id))
  const budgeted = categories.filter((c) => budgetedIds.has(c.id))

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
        <div className="flex items-center justify-between gap-3 mb-1">
          <div>
            <h2 className="text-white text-[17px] font-bold">Your budgets</h2>
            <p className="text-tertiary text-[12px]">Each one is also a category when you add an expense</p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 h-10 pl-3 pr-4 rounded-xl bg-accent text-black text-[14px] font-semibold flex items-center gap-1.5"
          >
            <Plus size={17} strokeWidth={2.6} /> Add
          </button>
        </div>

        {budgeted.length === 0 ? (
          <p className="text-secondary text-[14px] leading-relaxed py-6 text-center">
            No category budgets yet. Add one for anything you want to watch, like Family allowance or
            Outside food.
          </p>
        ) : (
          <div className="flex flex-col gap-5 mt-5">
            {budgeted.map((c) => {
              const line = lineFor(c.id)
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                        <CategoryIcon category={c} size={17} />
                      </span>
                      <span className="text-white font-medium text-[15px] truncate">{c.name}</span>
                    </span>
                    <LimitInput value={limitFor(c.id)} onCommit={(n) => budgetRepo.set(c.id, n)} />
                    <button
                      type="button"
                      onClick={() => budgetRepo.set(c.id, 0)}
                      aria-label={`Remove ${c.name} budget`}
                      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-tertiary hover:text-white"
                    >
                      <X size={17} />
                    </button>
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
        )}
      </Card>

      <AddBudgetSheet
        open={adding}
        onClose={() => setAdding(false)}
        categories={categories}
        budgetedIds={budgetedIds}
      />
    </div>
  )
}
