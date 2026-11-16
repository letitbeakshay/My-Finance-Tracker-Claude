import type { Expense, ExpenseType, PaymentMethod } from '../types'
import { normaliseNote } from './frequent'

export interface Suggestion {
  categoryId: string
  type: ExpenseType
  paymentMethod: PaymentMethod
  accountId?: string
  pleasesGod?: boolean
  savingsPlanId?: string
  /** How many past expenses back this up. */
  count: number
}

/**
 * Guesses the category, type, way of paying and bank from the note, learned from your own history:
 * the same note first, then a note that contains it, then one that shares a word. Needs a few letters to start.
 */
export function suggestFromNote(note: string, expenses: Expense[]): Suggestion | null {
  const n = normaliseNote(note)
  if (n.length < 2) return null
  const words = n.split(' ').filter((w) => w.length >= 3)

  let tier = 0
  const buckets: Map<string, { e: Expense; count: number }>[] = [new Map(), new Map(), new Map(), new Map()]
  for (const e of expenses) {
    const en = normaliseNote(e.notes)
    if (!en) continue
    let t = 0
    if (en === n) t = 3
    else if (n.length >= 3 && (en.includes(n) || n.includes(en)) && en.length >= 3) t = 2
    else if (words.length && en.split(' ').some((w) => words.includes(w))) t = 1
    if (!t) continue
    if (t > tier) tier = t
    const key = `${e.categoryId}|${e.type}|${e.paymentMethod}|${e.accountId ?? ''}|${e.pleasesGod ?? ''}`
    const g = buckets[t].get(key)
    if (!g) buckets[t].set(key, { e, count: 1 })
    else {
      g.count++
      if (e.date > g.e.date) g.e = e
    }
  }
  if (!tier) return null
  const best = [...buckets[tier].values()].sort((a, b) => b.count - a.count || (a.e.date < b.e.date ? 1 : -1))[0]
  const e = best.e
  return {
    categoryId: e.categoryId,
    type: e.type,
    paymentMethod: e.paymentMethod,
    accountId: e.accountId,
    pleasesGod: e.pleasesGod,
    savingsPlanId: e.savingsPlanId,
    count: best.count,
  }
}
