import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAllCategories, useBudgets, useExpenses } from '../../hooks/useLiveData'
import { buildTree, parentMap } from '../../lib/categoryTree'
import { reimbursableIds } from '../../lib/reimbursement'
import { budgetRepo } from '../../db/repository'
import { budgetProgress } from '../../lib/budgets'
import { VERSES } from '../../lib/scripture'
import { OVERALL_BUDGET_ID } from '../../types'
import { Card } from '../ui/Card'
import { CategoryIcon } from '../ui/CategoryIcon'
import { BudgetBar } from './BudgetBar'
import { NewCategorySheet } from '../settings/NewCategorySheet'

const FIELD =
  'w-28 h-11 bg-surface border border-border rounded-xl px-3 text-white text-[16px] text-right tabular-nums placeholder:text-tertiary'

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

/** Every category with an optional monthly limit, plus a way to add a new category. */
export function BudgetsView({ month }: { month: Date }) {
  const budgets = useBudgets()
  const expenses = useExpenses()
  const allCategories = useAllCategories()
  const categories = useMemo(() => (allCategories ?? []).filter((c) => !c.archived), [allCategories])
  const [adding, setAdding] = useState(false)

  const progress = useMemo(
    () =>
      budgets && expenses
        ? budgetProgress(budgets, expenses, month, {
            parents: parentMap(categories),
            reimbursable: reimbursableIds(categories),
          })
        : null,
    [budgets, expenses, month, categories],
  )
  if (!budgets || !expenses || !allCategories || !progress) return null
  // A budget on a top-level category covers everything under it (Eating Out covers Coffee and Snacks).
  const topLevel = buildTree(categories).map((n) => n.category)

  const limitFor = (id: string) => budgets.find((b) => b.id === id)?.monthlyLimit
  const lineFor = (id: string) => progress.categories.find((l) => l.categoryId === id)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start">
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
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-1">
          <div>
            <h2 className="text-white text-[17px] font-bold">By category</h2>
            <p className="text-tertiary text-[12px]">Covers everything under it. Leave blank for no limit</p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 h-10 pl-3 pr-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center gap-1.5"
          >
            <Plus size={17} strokeWidth={2.6} /> Add
          </button>
        </div>

        <div className="flex flex-col gap-5 mt-5">
          {topLevel.map((c) => {
            const line = lineFor(c.id)
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                      <CategoryIcon category={c} size={17} />
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

      <NewCategorySheet open={adding} onClose={() => setAdding(false)} onCreated={() => setAdding(false)} />
    </div>
  )
}
