const key = (method: string) => `finance_tracker_last_account_${method}`

/** The card or bank account last used with a payment method, so the next expense starts with it picked. */
export function lastAccountFor(method: string): string | null {
  try {
    return localStorage.getItem(key(method))
  } catch {
    return null
  }
}

export function rememberAccount(method: string, accountId: string | null | undefined) {
  try {
    if (accountId) localStorage.setItem(key(method), accountId)
  } catch {
    /* private mode: just do not remember */
  }
}

/**
 * The account used most often with a payment method (UPI: your usual bank), counted from your past expenses.
 * Only accounts that still exist and fit the method are considered; a tie goes to the more recently used one.
 */
export function mostUsedAccountFor(
  method: string,
  expenses: { paymentMethod: string; accountId?: string; date: string }[],
  validIds: Set<string>,
): string | null {
  const stats = new Map<string, { n: number; last: string }>()
  for (const e of expenses) {
    if (e.paymentMethod !== method || !e.accountId || !validIds.has(e.accountId)) continue
    const s = stats.get(e.accountId) ?? { n: 0, last: '' }
    s.n++
    if (e.date > s.last) s.last = e.date
    stats.set(e.accountId, s)
  }
  let best: string | null = null
  for (const [id, s] of stats) {
    const b = best ? stats.get(best)! : null
    if (!b || s.n > b.n || (s.n === b.n && s.last > b.last)) best = id
  }
  return best
}
