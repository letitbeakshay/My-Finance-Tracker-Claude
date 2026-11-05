import { isSameMonth, parseISO } from 'date-fns'
import { OVERALL_BUDGET_ID, type Budget, type BudgetItem, type Expense } from '../types'

export type BudgetStatus = 'ok' | 'warning' | 'over'

export interface BudgetLine {
  /** `null` for the overall budget. */
  categoryId: string | null
  limit: number
  spent: number
  /** Percent of the limit used; may exceed 100. */
  pct: number
  remaining: number
  status: BudgetStatus
}

function line(categoryId: string | null, limit: number, spent: number): BudgetLine {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0
  return {
    categoryId,
    limit,
    spent,
    pct,
    remaining: limit - spent,
    // Judged on the exact amounts, not the rounded percent: ₹1001 of ₹1000 is over.
    status: spent > limit ? 'over' : limit > 0 && spent / limit >= 0.8 ? 'warning' : 'ok',
  }
}

/**
 * Progress against each budget for a month. The overall budget counts needs and
 * wants only — giving and saving are goals of their own (see the stewardship plan).
 * A category budget counts everything spent in that category.
 */
export function budgetProgress(
  budgets: Budget[],
  expenses: Expense[],
  month: Date,
  options: {
    /** sub-category id -> parent id, so a budget on a parent includes what is spent under it */
    parents?: Map<string, string>
    /** reimbursable categories, left out of the overall budget */
    reimbursable?: Set<string>
    /** the total of the monthly plan; when set it is the overall limit */
    overallLimit?: number
  } = {},
) {
  const { parents, reimbursable, overallLimit } = options
  const monthExpenses = expenses.filter((e) => isSameMonth(parseISO(e.date), month))
  const sum = (items: Expense[]) => items.reduce((s, e) => s + e.amount, 0)
  const inCategory = (e: Expense, id: string) => e.categoryId === id || parents?.get(e.categoryId) === id

  const overallBudget = budgets.find((b) => b.id === OVERALL_BUDGET_ID)
  const overallTotal = overallLimit && overallLimit > 0 ? overallLimit : overallBudget?.monthlyLimit
  const overall = overallTotal
    ? line(
        null,
        overallTotal,
        sum(
          monthExpenses.filter(
            (e) => (e.type === 'need' || e.type === 'want') && !reimbursable?.has(e.categoryId),
          ),
        ),
      )
    : null

  const categories = budgets
    .filter((b) => b.categoryId)
    .map((b) =>
      line(b.categoryId!, b.monthlyLimit, sum(monthExpenses.filter((e) => inCategory(e, b.categoryId!)))),
    )
    .sort((a, b) => b.pct - a.pct)

  return { overall, categories, spentByCategory: (id: string) => sum(monthExpenses.filter((e) => inCategory(e, id))) }
}

export const BUDGET_STATUS_COLOR: Record<BudgetStatus, string> = {
  ok: 'var(--color-positive)',
  warning: 'var(--color-warning)',
  over: 'var(--color-danger)',
}

/** A category limit, and whether it comes from the monthly plan (rather than being typed on the category). */
export interface EffectiveBudget extends Budget {
  fromPlan?: boolean
  /** Names of the plan lines that make up a plan-derived limit. */
  planNames?: string[]
}

/**
 * Every limit that applies. A limit typed on a category wins; otherwise the plan lines linked to that
 * category add up to its limit (Fuel ₹3,000 in the plan means Fuel is limited to ₹3,000).
 */
export function effectiveBudgets(budgets: Budget[], items: BudgetItem[]): EffectiveBudget[] {
  const typed = new Set(budgets.filter((b) => b.categoryId).map((b) => b.categoryId))
  const byCategory = new Map<string, BudgetItem[]>()
  for (const item of items) {
    if (!item.categoryId || typed.has(item.categoryId)) continue
    byCategory.set(item.categoryId, [...(byCategory.get(item.categoryId) ?? []), item])
  }
  const derived: EffectiveBudget[] = [...byCategory].map(([categoryId, list]) => ({
    id: `plan:${categoryId}`,
    categoryId,
    monthlyLimit: list.reduce((sum, i) => sum + i.amount, 0),
    createdAt: 0,
    fromPlan: true,
    planNames: list.map((i) => i.name),
  }))
  return [...budgets, ...derived]
}
