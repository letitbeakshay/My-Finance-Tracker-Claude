import { useMemo, useState } from 'react'
import { endOfMonth, getDate, isSameMonth } from 'date-fns'
import { ChevronRight, Pencil, Plus, Repeat } from 'lucide-react'
import { useAllCategories, useBudgetItems, useEffectiveBudgets, useExpenses } from '../../hooks/useLiveData'
import { buildTree, parentMap } from '../../lib/categoryTree'
import { reimbursableIds } from '../../lib/reimbursement'
import { BUDGET_STATUS_COLOR, budgetProgress, type BudgetLine } from '../../lib/budgets'
import { VERSES } from '../../lib/scripture'
import { formatCurrency } from '../../lib/currency'
import { itemsForMonth } from '../../lib/planMonth'
import { formatMonthLabel } from '../../lib/analytics'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BottomSheet } from '../ui/BottomSheet'
import { CategoryIcon } from '../ui/CategoryIcon'
import { NewCategorySheet } from '../settings/NewCategorySheet'
import { BudgetItemSheet } from './BudgetItemSheet'
import { CategoryLimitForm } from './CategoryLimitForm'
import { BudgetSpendDetail, type BudgetDetailTarget } from './BudgetSpendDetail'
import type { BudgetItem, Category } from '../../types'

const STATUS_LABEL = { ok: 'On track', warning: 'Close to limit', over: 'Over budget' } as const

function Meter({ pct, color, height = 'h-2' }: { pct: number; color: string; height?: string }) {
  return (
    <div className={`${height} rounded-full bg-white/5 overflow-hidden`}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  )
}

function Pill({ status }: { status: BudgetLine['status'] }) {
  const color = BUDGET_STATUS_COLOR[status]
  return (
    <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold shrink-0" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Set, change or remove the monthly limit for one category. */
function LimitSheet({
  category,
  current,
  fromPlan,
  spent,
  onClose,
  onSeeSpending,
}: {
  category: Category | null
  current?: number
  fromPlan: boolean
  spent: number
  onClose: () => void
  onSeeSpending: () => void
}) {
  return (
    <BottomSheet open={!!category} onClose={onClose}>
      {category && (
        <>
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">Monthly limit</p>
          <h2 className="text-white text-[22px] font-bold mt-0.5">{category.name}</h2>
          <p className="text-secondary text-[14px] mt-1 mb-4 tabular-nums">{formatCurrency(spent)} spent this month</p>
          <CategoryLimitForm category={category} current={current} fromPlan={fromPlan} onSaved={onClose} />
          <Button variant="secondary" className="mt-3" onClick={onSeeSpending}>
            See spending
          </Button>
        </>
      )}
    </BottomSheet>
  )
}

/** Budgets: how the month is going overall, the monthly plan, and a limit for any category. */
export function BudgetsView({ month }: { month: Date }) {
  const budgets = useEffectiveBudgets(month)
  const expenses = useExpenses()
  const allCategories = useAllCategories()
  const categories = useMemo(() => (allCategories ?? []).filter((c) => !c.archived), [allCategories])
  const allPlanItems = useBudgetItems()
  // Only the lines that apply in this month: the ones that repeat, plus any made for this month alone.
  const planItems = useMemo(() => itemsForMonth(allPlanItems, month), [allPlanItems, month])
  const [adding, setAdding] = useState(false)
  const [detail, setDetail] = useState<BudgetDetailTarget | null>(null)
  const [limitFor, setLimitFor] = useState<Category | null>(null)
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item: BudgetItem | null }>({ open: false, item: null })

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
  if (detail) return <BudgetSpendDetail target={detail} month={month} onBack={() => setDetail(null)} onChange={setDetail} />

  const topLevel = buildTree(categories).map((n) => n.category)
  const items = planItems ?? []
  const hasPlan = items.length > 0
  const overall = progress.overall
  const lineFor = (id: string) => progress.categories.find((l) => l.categoryId === id)
  const budgetFor = (id: string) => budgets.find((b) => b.categoryId === id)
  const withLimit = topLevel.filter((c) => lineFor(c.id))
  const noLimit = topLevel.filter((c) => !lineFor(c.id))

  const renderItem = (item: BudgetItem) => {
    const linked = item.categoryIds.filter((id) => !item.categoryIds.includes(allCategories.find((c) => c.id === id)?.parentId ?? ''))
    const spent = linked.length ? linked.reduce((sum, id) => sum + progress.spentByCategory(id), 0) : null
    const pct = spent !== null && item.amount > 0 ? (spent / item.amount) * 100 : 0
    const over = spent !== null && spent > item.amount
    const near = spent !== null && !over && pct >= 80
    const color = over ? BUDGET_STATUS_COLOR.over : near ? BUDGET_STATUS_COLOR.warning : BUDGET_STATUS_COLOR.ok
    return (
      <div key={item.id} className="flex items-stretch">
        <button
          type="button"
          disabled={spent === null}
          onClick={() => setDetail({ title: item.name, categoryIds: linked, limit: item.amount, item })}
          className="flex-1 min-w-0 text-left pl-5 py-4 disabled:cursor-default"
          aria-label={spent === null ? item.name : `See what was spent on ${item.name}`}
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-1 min-w-0 text-white text-[16px] font-medium">
              <span className="truncate">{item.name}</span>
              {spent !== null && <ChevronRight size={15} className="text-tertiary shrink-0" />}
            </span>
            <span className="text-white text-[16px] font-semibold tabular-nums shrink-0">{formatCurrency(item.amount)}</span>
          </span>
          {spent !== null ? (
            <span className="block mt-2.5">
              <Meter pct={pct} color={color} />
              <span className="flex justify-between text-[12px] mt-1.5 tabular-nums">
                <span className="text-tertiary">{formatCurrency(spent)} spent</span>
                <span style={{ color: over || near ? color : 'var(--color-tertiary)' }}>
                  {over ? `${formatCurrency(spent - item.amount)} over` : `${formatCurrency(item.amount - spent)} left`}
                </span>
              </span>
            </span>
          ) : (
            <span className="block text-tertiary text-[12px] mt-1">Fixed amount, not linked to a category</span>
          )}
        </button>
        <button type="button" onClick={() => setItemSheet({ open: true, item })} aria-label={`Edit ${item.name}`} className="w-14 shrink-0 flex items-center justify-center text-tertiary">
          <Pencil size={16} />
        </button>
      </div>
    )
  }

  // Pace: how much of the month has gone, against how much of the budget is used.
  const now = new Date()
  const current = isSameMonth(month, now)
  const daysInMonth = getDate(endOfMonth(month))
  const daysLeft = current ? daysInMonth - getDate(now) + 1 : 0
  const perDay = overall && overall.remaining > 0 && daysLeft > 0 ? overall.remaining / daysLeft : 0
  const monthPct = current ? (getDate(now) / daysInMonth) * 100 : null
  const heroColor = overall ? BUDGET_STATUS_COLOR[overall.status] : 'var(--color-accent)'

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* Overall */}
      <Card className="!p-6">
        {overall ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">Overall budget</p>
              <Pill status={overall.status} />
            </div>
            <p className="text-white text-[34px] font-bold tabular-nums leading-none mt-3">
              {formatCurrency(overall.spent)}
              <span className="text-tertiary text-[16px] font-medium"> of {formatCurrency(overall.limit)}</span>
            </p>
            <div className="relative mt-4">
              <Meter pct={overall.pct} color={heroColor} height="h-3" />
              {monthPct !== null && (
                <span className="absolute -top-1 bottom-[-4px] w-0.5 bg-white/60 rounded" style={{ left: `${monthPct}%` }} title="Where the month is" />
              )}
            </div>
            {monthPct !== null && <p className="text-tertiary text-[11px] mt-1.5">The line marks how far through the month you are.</p>}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <p className="text-tertiary text-[12px]">{overall.remaining >= 0 ? 'Left' : 'Over by'}</p>
                <p className="text-[18px] font-bold tabular-nums mt-0.5" style={{ color: overall.remaining >= 0 ? 'var(--color-white)' : heroColor }}>
                  {formatCurrency(Math.abs(overall.remaining))}
                </p>
              </div>
              <div>
                <p className="text-tertiary text-[12px]">{current ? 'Per day' : 'Used'}</p>
                <p className="text-white text-[18px] font-bold tabular-nums mt-0.5">{current ? (perDay ? formatCurrency(Math.round(perDay)) : '—') : `${overall.pct}%`}</p>
              </div>
              <div>
                <p className="text-tertiary text-[12px]">{current ? 'Days left' : 'Monthly plan'}</p>
                <p className="text-white text-[18px] font-bold tabular-nums mt-0.5">{current ? daysLeft : formatCurrency(planTotal)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-white text-[18px] font-bold">Plan your month</p>
            <p className="text-secondary text-[14px] mt-1 leading-relaxed">
              List what you plan to spend each month (EMIs, what you give at home, fuel…). The total becomes your overall budget.
            </p>
            <Button className="!w-auto px-6 mt-4" onClick={() => setItemSheet({ open: true, item: null })}>
              Add your first plan item
            </Button>
          </>
        )}
        <p className="text-tertiary text-[12px] italic mt-5 leading-relaxed">
          “{VERSES.diligent.text}” — {VERSES.diligent.ref}
        </p>
      </Card>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-2 items-start">
        {/* This month's plan */}
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <div>
              <h2 className="text-white text-[18px] font-bold">{formatMonthLabel(month)} plan</h2>
              <p className="text-tertiary text-[12px]">
                {hasPlan ? `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${formatCurrency(planTotal)} planned` : 'Plan everything you will spend this month'}
              </p>
            </div>
            <button type="button" onClick={() => setItemSheet({ open: true, item: null })} className="h-10 pl-3 pr-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center gap-1.5 shrink-0">
              <Plus size={16} strokeWidth={2.6} /> Add item
            </button>
          </div>

          {[
            { key: 'repeat', title: 'Every month', note: 'Comes back each month', list: items.filter((i) => i.recurring) },
            { key: 'once', title: `Only ${formatMonthLabel(month)}`, note: 'Does not carry over', list: items.filter((i) => !i.recurring) },
          ].map((group) =>
            group.list.length === 0 ? null : (
              <div key={group.key}>
                <div className="flex items-center justify-between gap-3 px-5 py-2 bg-surface/60 border-y border-border/60">
                  <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
                    {group.key === 'repeat' && <Repeat size={13} />} {group.title}
                    <span className="normal-case font-normal text-tertiary tracking-normal">· {group.note}</span>
                  </p>
                  <p className="text-secondary text-[12px] font-semibold tabular-nums">{formatCurrency(group.list.reduce((s, i) => s + i.amount, 0))}</p>
                </div>
                <div className="divide-y divide-border/60">{group.list.map(renderItem)}</div>
              </div>
            ),
          )}
          {!hasPlan && (
            <p className="text-tertiary text-[13px] px-5 pb-6 leading-relaxed">
              Add what you plan to spend this month. Mark a line “Every month” (EMIs, what you give at home) and it comes back next month with the same name and amount. Anything else counts for this month only.
            </p>
          )}
        </Card>

        {/* Category limits */}
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 p-5 pb-3">
            <div>
              <h2 className="text-white text-[18px] font-bold">Category limits</h2>
              <p className="text-tertiary text-[12px]">A limit covers everything under the category</p>
            </div>
            <button type="button" onClick={() => setAdding(true)} className="h-10 pl-3 pr-4 rounded-xl bg-surface border border-border text-white text-[14px] font-semibold flex items-center gap-1.5 shrink-0">
              <Plus size={16} strokeWidth={2.6} /> Category
            </button>
          </div>

          {withLimit.length > 0 && (
            <div className="divide-y divide-border/60">
              {withLimit.map((c) => {
                const line = lineFor(c.id)!
                const color = BUDGET_STATUS_COLOR[line.status]
                return (
                  <div key={c.id} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setDetail({ title: c.name, categoryIds: [c.id], limit: line.limit, category: c, limitFromPlan: !!budgetFor(c.id)?.fromPlan })}
                      className="flex-1 min-w-0 text-left pl-5 py-4"
                      aria-label={`See what was spent on ${c.name}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                          <CategoryIcon category={c} size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="flex items-center gap-1 text-white text-[16px] font-medium min-w-0">
                              <span className="truncate">{c.name}</span>
                              <ChevronRight size={15} className="text-tertiary shrink-0" />
                            </span>
                            <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: line.status === 'ok' ? 'var(--color-secondary)' : color }}>
                              {line.pct}%
                            </span>
                          </span>
                          <span className="block mt-2">
                            <Meter pct={line.pct} color={color} />
                          </span>
                          <span className="flex justify-between text-[12px] mt-1.5 tabular-nums">
                            <span className="text-tertiary">{formatCurrency(line.spent)} of {formatCurrency(line.limit)}</span>
                            <span style={{ color: line.status === 'ok' ? 'var(--color-tertiary)' : color }}>
                              {line.remaining >= 0 ? `${formatCurrency(line.remaining)} left` : `${formatCurrency(-line.remaining)} over`}
                            </span>
                          </span>
                        </span>
                      </span>
                    </button>
                    <button type="button" onClick={() => setLimitFor(c)} aria-label={`Change the limit for ${c.name}`} className="w-14 shrink-0 flex items-center justify-center text-tertiary">
                      <Pencil size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {noLimit.length > 0 && (
            <>
              <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide px-5 pt-4 pb-1">No limit yet</p>
              <div className="divide-y divide-border/60 pb-2">
                {noLimit.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <button type="button" onClick={() => setDetail({ title: c.name, categoryIds: [c.id], category: c })} className="flex items-center gap-3 flex-1 min-w-0 text-left" aria-label={`See what was spent on ${c.name}`}>
                      <span className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                        <CategoryIcon category={c} size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-white text-[15px] truncate">{c.name}</span>
                        <span className="block text-tertiary text-[12px] tabular-nums">{formatCurrency(progress.spentByCategory(c.id))} spent</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => setLimitFor(c)} className="h-9 px-3.5 rounded-full border border-border bg-surface text-accent-ink text-[13px] font-semibold shrink-0">
                      Set limit
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <LimitSheet
        category={limitFor}
        current={limitFor ? budgetFor(limitFor.id)?.monthlyLimit : undefined}
        fromPlan={!!(limitFor && budgetFor(limitFor.id)?.fromPlan)}
        spent={limitFor ? progress.spentByCategory(limitFor.id) : 0}
        onClose={() => setLimitFor(null)}
        onSeeSpending={() => {
          if (limitFor) setDetail({ title: limitFor.name, categoryIds: [limitFor.id], limit: budgetFor(limitFor.id)?.monthlyLimit, category: limitFor, limitFromPlan: !!budgetFor(limitFor.id)?.fromPlan })
          setLimitFor(null)
        }}
      />
      <BudgetItemSheet open={itemSheet.open} month={month} item={itemSheet.item} onClose={() => setItemSheet({ open: false, item: null })} />
      <NewCategorySheet open={adding} onClose={() => setAdding(false)} onCreated={() => setAdding(false)} />
    </div>
  )
}
