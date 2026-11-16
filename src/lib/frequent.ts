import { subDays } from 'date-fns'
import type { Category, Expense } from '../types'

const norm = (s?: string) =>
  (s ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const normaliseNote = norm

export interface Frequent {
  key: string
  /** What it is called on the chip: the note, or the category. */
  label: string
  /** The category name, when the label is a note. */
  sub?: string
  amount: number
  count: number
  /** The most recent time it was added: everything is copied from it. */
  template: Expense
}

function toFrequent(e: Expense, count: number, categories: Map<string, Category>): Frequent {
  const cat = categories.get(e.categoryId)
  const note = (e.notes ?? '').trim()
  return {
    key: `${e.categoryId}|${norm(e.notes)}|${e.paymentMethod}|${e.accountId ?? ''}`,
    label: note || cat?.name || 'Expense',
    sub: note ? cat?.name : undefined,
    amount: e.amount,
    count,
    template: e,
  }
}

/**
 * The expenses you add again and again (same category, note, way of paying and account), most common first,
 * plus the very last expense you added so it can be repeated in one tap.
 */
export function frequentExpenses(expenses: Expense[], categories: Category[], now = new Date(), limit = 5) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const since = subDays(now, 120).toISOString().slice(0, 10)
  const recent = expenses.filter((e) => e.date >= since && byId.has(e.categoryId))
  const groups = new Map<string, { latest: Expense; count: number }>()
  for (const e of recent) {
    const key = `${e.categoryId}|${norm(e.notes)}|${e.paymentMethod}|${e.accountId ?? ''}`
    const g = groups.get(key)
    if (!g) groups.set(key, { latest: e, count: 1 })
    else {
      g.count++
      if (e.date > g.latest.date || (e.date === g.latest.date && e.createdAt > g.latest.createdAt)) g.latest = e
    }
  }
  const top = [...groups.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count || (a.latest.date < b.latest.date ? 1 : -1))
    .slice(0, limit)
    .map((g) => toFrequent(g.latest, g.count, byId))

  const lastExpense = [...recent].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))[0]
  const last = lastExpense ? toFrequent(lastExpense, groups.get(`${lastExpense.categoryId}|${norm(lastExpense.notes)}|${lastExpense.paymentMethod}|${lastExpense.accountId ?? ''}`)?.count ?? 1, byId) : undefined
  return { last, top: top.filter((t) => t.key !== last?.key) }
}
