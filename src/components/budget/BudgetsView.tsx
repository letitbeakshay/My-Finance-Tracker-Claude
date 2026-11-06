import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { useAllCategories, useBudgetItems, useEffectiveBudgets, useExpenses } from '../../hooks/useLiveData'
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
import { BudgetItemSheet } from './BudgetItemSheet'
import { BudgetSpendDetail, type BudgetDetailTarget } from './BudgetSpendDetail'
import { formatCurrency } from '../../lib/currency'
import type { BudgetItem } from '../../types'

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
      {error && <p className="text-danger text-[11px] mt-1">Not saved — database update needed</p>}
    </div>
  )
}

/** Every category with an optional monthly limit, plus a way to add a new category. */
export function BudgetsView({ month }: { month: Date }) {
  const budgets = useEffectiveBudgets()
  const expenses = useExpenses()
  const allCategories = useAllCategories()
  const categories = useMemo(() => (allCategories ?? []).filter((c) => !c.archived), [allCategories])
  const planItems = useBudgetItems()
  const [adding, setAdding] = useState(false)
  const [detail, setDetail] = useState<BudgetDetailTarget | null>(null)
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item: BudgetItem | null }>({ open: false, item: null })

  // The total of the monthly plan, when there is one, is the overall budget.
  const planTotal = (planItems ?? []).reduce((sum, i) => sum + i.amount, 0)

  const progress = useMemo(
    () =>
      budgets && expenses
        ? budgetProgress(budgets, expenses, month, {
            parents: parentMap(categories),
            reimbursable: reimbursableIds(categories),
            overallLimit: planTotal,
          })
        : null,
    [budgets, expenses, month, categories, planTotal],
  )
  if (!budgets || !expenses || !allCategories || !progress) return null
  if (detail) return <BudgetSpendDetail target={detail} month={month} onBack={() => setDetail(null)} />
  // A budget on a top-level category covers everything under it (Eating Out covers Coffee and Snacks).
  const topLevel = buildTree(categories).map((n) => n.category)

  const hasPlan = (planItems ?? []).length > 0
  const limitFor = (id: string) => budgets.find((b) => b.id === id)?.monthlyLimit
  const categoryLimit = (categoryId: string) => budgets.find((b) => b.categoryId === categoryId)?.monthlyLimit
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-white text-[17px] font-bold">Overall monthly budget</h2>
              <p className="text-tertiary text-[12px]">
                {hasPlan ? 'The total of your monthly plan' : 'Needs and wants together'}
              </p>
            </div>
            {hasPlan ? (
              <p className="text-white text-[24px] font-bold tabular-nums leading-none pt-0.5">{formatCurrency(planTotal)}</p>
            ) : (
              <LimitInput value={limitFor(OVERALL_BUDGET_ID)} onCommit={(n) => budgetRepo.set(null, n)} />
            )}
          </div>
          {progress.overall && (
            <div className="mt-3">
              <BudgetBar line={progress.overall} />
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide">Monthly plan</p>
              <button
                type="button"
                onClick={() => setItemSheet({ open: true, item: null })}
                className="h-9 pl-2.5 pr-3.5 rounded-xl bg-primary text-on-primary text-[13px] font-semibold flex items-center gap-1"
              >
                <Plus size={15} strokeWidth={2.6} /> Add item
              </button>
            </div>

            {hasPlan ? (
              <div className="mt-2">
                <div className="flex items-center justify-between py-2.5 border-b border-border">
                  <span className="text-white font-bold text-[15px]">Total</span>
                  <span className="text-white font-bold text-[15px] tabular-nums">{formatCurrency(planTotal)}</span>
                </div>
                {(planItems ?? []).map((item) => {
                  const linked = item.categoryIds.filter((id) => !item.categoryIds.includes(allCategories.find((c) => c.id === id)?.parentId ?? ''))
                  const spent = linked.length ? linked.reduce((sum, id) => sum + progress.spentByCategory(id), 0) : null
                  const pct = spent !== null && item.amount > 0 ? Math.min(100, (spent / item.amount) * 100) : 0
                  const over = spent !== null && spent > item.amount
                  return (
                    <div key={item.id} className="border-b border-border/60 last:border-0">
                    <button
                      type="button"
                      onClick={() => setItemSheet({ open: true, item })}
                      className="w-full text-left py-2.5 pb-1.5"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-white text-[15px] truncate">{item.name}</span>
                        <span className="text-white text-[15px] tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
                      </span>
                      {spent !== null && (
                        <span className="block mt-1.5">
                          <span className="block h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${pct}%`, background: over ? 'var(--color-danger)' : 'var(--color-positive)' }}
                            />
                          </span>
                          <span className="block text-[12px] mt-1 tabular-nums" style={{ color: over ? 'var(--color-danger)' : 'var(--color-tertiary)' }}>
                            {formatCurrency(spent)} spent this month
                            {over ? ` · ${formatCurrency(spent - item.amount)} over` : ` · ${formatCurrency(item.amount - spent)} left`}
                          </span>
                        </span>
                      )}
                    </button>
                    {linked.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDetail({ title: item.name, categoryIds: linked, limit: item.amount })}
                        className="h-9 mb-1.5 text-accent-ink text-[13px] font-semibold flex items-center gap-0.5"
                      >
                        See what was spent <ChevronRight size={15} />
                      </button>
                    )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-tertiary text-[13px] leading-relaxed mt-2">
                List what you plan to spend each month (EMIs, what you give at home, fuel…). The total becomes your overall
                budget.
              </p>
            )}
          </div>
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
                    <button
                      type="button"
                      onClick={() => setDetail({ title: c.name, categoryIds: [c.id], limit: categoryLimit(c.id) })}
                      className="min-w-0 text-left"
                      aria-label={`See what was spent on ${c.name}`}
                    >
                      <span className="flex items-center gap-0.5 text-white font-medium text-[15px]">
                        <span className="truncate">{c.name}</span>
                        <ChevronRight size={15} className="text-tertiary shrink-0" />
                      </span>
                      {!line && (
                        <span className="block text-tertiary text-[12px] tabular-nums">
                          ₹{Math.round(progress.spentByCategory(c.id)).toLocaleString('en-IN')} spent this month
                        </span>
                      )}
                    </button>
                  </span>
                  <LimitInput value={categoryLimit(c.id)} onCommit={(n) => budgetRepo.set(c.id, n)} />
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

      <BudgetItemSheet
        open={itemSheet.open}
        item={itemSheet.item}
        onClose={() => setItemSheet({ open: false, item: null })}
      />
      <NewCategorySheet open={adding} onClose={() => setAdding(false)} onCreated={() => setAdding(false)} />
    </div>
  )
}
