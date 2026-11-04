import { format, isSameMonth, parseISO } from 'date-fns'
import type { AppSettings, Expense, Income, Loan, Reflection } from '../types'
import { formatCurrency } from './currency'
import { VERSES } from './scripture'

export interface MonthPlan {
  income: number
  given: number
  saved: number
  /** Needs + wants: what was actually lived on. */
  lived: number
  givingTarget: number
  savingTarget: number
  /** Still to give to reach the giving target; never negative. */
  givingRemaining: number
  /** Share of income, in percent (0 when there is no income yet). */
  givenPct: number
  savedPct: number
  livedPct: number
}

const sumAmounts = (items: { amount: number }[]) => items.reduce((s, i) => s + i.amount, 0)

export function monthPlan(
  expenses: Expense[],
  incomes: Income[],
  month: Date,
  settings: Pick<AppSettings, 'givingPercent' | 'savingPercent'>,
): MonthPlan {
  const inMonth = (date: string) => isSameMonth(parseISO(date), month)
  const monthExpenses = expenses.filter((e) => inMonth(e.date))
  const income = sumAmounts(incomes.filter((i) => inMonth(i.date)))
  const given = sumAmounts(monthExpenses.filter((e) => e.type === 'giving'))
  const saved = sumAmounts(monthExpenses.filter((e) => e.type === 'savings'))
  const lived = sumAmounts(monthExpenses.filter((e) => e.type === 'need' || e.type === 'want'))
  const givingTarget = (income * settings.givingPercent) / 100
  const pct = (n: number) => (income > 0 ? Math.round((n / income) * 100) : 0)

  return {
    income,
    given,
    saved,
    lived,
    givingTarget,
    savingTarget: (income * settings.savingPercent) / 100,
    givingRemaining: Math.max(0, givingTarget - given),
    givenPct: pct(given),
    savedPct: pct(saved),
    livedPct: pct(lived),
  }
}

export function debtSummary(loans: Loan[]) {
  const borrowed = loans.filter((l) => l.kind === 'borrowed')
  const principal = borrowed.reduce((s, l) => s + l.principal, 0)
  const paid = borrowed.reduce((s, l) => s + l.paid, 0)
  return {
    principal,
    paid,
    owed: principal - paid,
    paidPct: principal > 0 ? Math.round((paid / principal) * 100) : 0,
    count: borrowed.filter((l) => !l.closed).length,
  }
}

/** Plain-text month report, meant to be shared with a spouse, mentor or pastor. */
export function buildReport(
  month: Date,
  plan: MonthPlan,
  owed: number,
  reflection?: Pick<Reflection, 'gratitude' | 'improve' | 'commitment'>,
) {
  const lines = [
    `Stewardship report — ${format(month, 'MMMM yyyy')}`,
    '',
    `Received: ${formatCurrency(plan.income)}`,
    `Gave: ${formatCurrency(plan.given)} (${plan.givenPct}%)`,
    `Saved: ${formatCurrency(plan.saved)} (${plan.savedPct}%)`,
    `Lived on: ${formatCurrency(plan.lived)} (${plan.livedPct}%)`,
    `Debt outstanding: ${formatCurrency(owed)}`,
  ]
  if (reflection?.gratitude.trim()) lines.push('', `Grateful for: ${reflection.gratitude.trim()}`)
  if (reflection?.improve.trim()) lines.push('', `To change: ${reflection.improve.trim()}`)
  if (reflection?.commitment.trim()) lines.push('', `Commitment: ${reflection.commitment.trim()}`)
  lines.push('', `"${VERSES.faithful.text}" — ${VERSES.faithful.ref}`)
  return lines.join('\n')
}
