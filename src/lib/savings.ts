import { differenceInCalendarMonths, isSameMonth, parseISO } from 'date-fns'
import type { Expense, SavingsKind, SavingsPlan } from '../types'

export const SAVINGS_KINDS: { value: SavingsKind; label: string; icon: string; hint: string }[] = [
  { value: 'fd', label: 'Fixed Deposit (FD)', icon: '🔒', hint: 'A lump sum locked for a period' },
  { value: 'rd', label: 'Recurring Deposit (RD)', icon: '🔁', hint: 'A fixed amount every month' },
  { value: 'sip', label: 'Mutual fund / SIP', icon: '📈', hint: 'Invested every month' },
  { value: 'ppf', label: 'PPF / EPF / NPS', icon: '🏛️', hint: 'Long-term, government backed' },
  { value: 'gold', label: 'Gold', icon: '🪙', hint: 'Gold you buy over time' },
  { value: 'chit', label: 'Chit fund', icon: '🤝', hint: 'A monthly chit' },
  { value: 'emergency', label: 'Emergency fund', icon: '🛟', hint: 'For a surprise bill' },
  { value: 'account', label: 'Savings account', icon: '🏦', hint: 'Kept in a bank account' },
  { value: 'other', label: 'Other', icon: '💰', hint: 'Anything else' },
]

export const kindMeta = (k: SavingsKind) => SAVINGS_KINDS.find((x) => x.value === k) ?? SAVINGS_KINDS[SAVINGS_KINDS.length - 1]

export interface PlanProgress {
  /** Opening amount plus everything saved into the plan. */
  saved: number
  contributions: Expense[]
  thisMonth: number
  pct: number | null
  remaining: number | null
  /** Months to the maturity date, when there is one in the future. */
  monthsLeft: number | null
  /** What to put in each month to reach the target by the maturity date. */
  neededPerMonth: number | null
}

export function planProgress(plan: SavingsPlan, expenses: Expense[], month: Date): PlanProgress {
  const contributions = expenses.filter((e) => e.savingsPlanId === plan.id).sort((a, b) => (a.date < b.date ? 1 : -1))
  const saved = plan.opening + contributions.reduce((s, e) => s + e.amount, 0)
  const thisMonth = contributions.filter((e) => isSameMonth(parseISO(e.date), month)).reduce((s, e) => s + e.amount, 0)
  const remaining = plan.target ? Math.max(0, plan.target - saved) : null
  const months = plan.maturityDate ? differenceInCalendarMonths(parseISO(plan.maturityDate), new Date()) : null
  const monthsLeft = months !== null && months > 0 ? months : null
  return {
    saved,
    contributions,
    thisMonth,
    pct: plan.target ? Math.min(100, (saved / plan.target) * 100) : null,
    remaining,
    monthsLeft,
    neededPerMonth: remaining && monthsLeft ? Math.ceil(remaining / monthsLeft) : null,
  }
}

/** Where a plan is kept, in words: the linked account, or the bank or fund house typed in. */
export function planWhere(plan: SavingsPlan, accountLabel?: string) {
  return [accountLabel ?? plan.institution].filter(Boolean).join('')
}
