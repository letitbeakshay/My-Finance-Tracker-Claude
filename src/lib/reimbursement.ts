import type { Category, Expense } from '../types'

/** Ids of reimbursable categories, plus everything under them. */
export function reimbursableIds(categories: Category[]) {
  const roots = new Set(categories.filter((c) => c.reimbursable).map((c) => c.id))
  const ids = new Set(roots)
  for (const c of categories) if (c.parentId && roots.has(c.parentId)) ids.add(c.id)
  return ids
}

/** Spending that is your own: reimbursable expenses are paid back, so they are left out. */
export function personalOnly(expenses: Expense[], reimbursable: Set<string>) {
  return reimbursable.size === 0 ? expenses : expenses.filter((e) => !reimbursable.has(e.categoryId))
}

export function pendingReimbursements(expenses: Expense[], reimbursable: Set<string>) {
  return expenses.filter((e) => reimbursable.has(e.categoryId) && !e.reimbursed)
}
