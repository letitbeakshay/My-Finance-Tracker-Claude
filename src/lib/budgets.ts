import { isSameMonth, parseISO } from 'date-fns'
import { OVERALL_BUDGET_ID, type Budget, type Expense } from '../types'

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
    status: pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'ok',
  }
}

/**
 * Progress against each budget for a month. The overall budget counts needs and
 * wants only — giving and saving are goals of their own (see the stewardship plan).
 * A category budget counts everything spent in that category.
 */
export function budgetProgress(budgets: Budget[], expenses: Expense[], month: Date) {
  const monthExpenses = expenses.filter((e) => isSameMonth(parseISO(e.date), month))
  const sum = (items: Expense[]) => items.reduce((s, e) => s + e.amount, 0)

  const overallBudget = budgets.find((b) => b.id === OVERALL_BUDGET_ID)
  const overall = overallBudget
    ? line(
        null,
        overallBudget.monthlyLimit,
        sum(monthExpenses.filter((e) => e.type === 'need' || e.type === 'want')),
      )
    : null

  const categories = budgets
    .filter((b) => b.categoryId)
    .map((b) =>
      line(b.categoryId!, b.monthlyLimit, sum(monthExpenses.filter((e) => e.categoryId === b.categoryId))),
    )
    .sort((a, b) => b.pct - a.pct)

  return { overall, categories, spentByCategory: (id: string) => sum(monthExpenses.filter((e) => e.categoryId === id)) }
}

export const BUDGET_STATUS_COLOR: Record<BudgetStatus, string> = {
  ok: '#66a7f6',
  warning: '#e39a5c',
  over: '#e55e50',
}
