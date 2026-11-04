import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import type { Expense, ExpenseType, PaymentMethod } from '../types'

export function toDate(expense: Expense) {
  return parseISO(expense.date)
}

export function filterByMonth(expenses: Expense[], monthDate: Date) {
  return expenses.filter((e) => isSameMonth(toDate(e), monthDate) && isSameYear(toDate(e), monthDate))
}

export function sum(expenses: Expense[]) {
  return expenses.reduce((acc, e) => acc + e.amount, 0)
}

export function sumByType(expenses: Expense[], type: ExpenseType) {
  return sum(expenses.filter((e) => e.type === type))
}

export function todaySpending(expenses: Expense[], today = new Date()) {
  return sum(expenses.filter((e) => isSameDay(toDate(e), today)))
}

export function yesterdaySpending(expenses: Expense[], today = new Date()) {
  const yesterday = subDays(today, 1)
  return sum(expenses.filter((e) => isSameDay(toDate(e), yesterday)))
}

export function thisWeekSpending(expenses: Expense[], today = new Date()) {
  const start = startOfWeek(today, { weekStartsOn: 1 })
  const end = endOfWeek(today, { weekStartsOn: 1 })
  return sum(expenses.filter((e) => {
    const d = toDate(e)
    return d >= start && d <= end
  }))
}

export function thisYearSpending(expenses: Expense[], today = new Date()) {
  return sum(expenses.filter((e) => isSameYear(toDate(e), today)))
}

export function typeBreakdown(expenses: Expense[]) {
  const total = sum(expenses) || 1
  const needs = sumByType(expenses, 'need')
  const wants = sumByType(expenses, 'want')
  const savings = sumByType(expenses, 'savings')
  const giving = sumByType(expenses, 'giving')
  return {
    needs,
    wants,
    savings,
    giving,
    needsPct: Math.round((needs / total) * 100),
    wantsPct: Math.round((wants / total) * 100),
    savingsPct: Math.round((savings / total) * 100),
    givingPct: Math.round((giving / total) * 100),
  }
}

export function categoryBreakdown(expenses: Expense[]) {
  const map = new Map<string, number>()
  for (const e of expenses) {
    map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function paymentMethodBreakdown(expenses: Expense[]) {
  const map = new Map<PaymentMethod, number>()
  for (const e of expenses) {
    map.set(e.paymentMethod, (map.get(e.paymentMethod) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export function weeklySpending(expenses: Expense[], monthDate: Date) {
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)
  const days = eachDayOfInterval({ start, end })

  const weeks: { label: string; amount: number }[] = []
  let currentWeekStart = start
  let weekIndex = 1

  while (currentWeekStart <= end) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const clampedEnd = weekEnd > end ? end : weekEnd
    const amount = sum(
      expenses.filter((e) => {
        const d = toDate(e)
        return d >= currentWeekStart && d <= clampedEnd
      }),
    )
    weeks.push({ label: `W${weekIndex}`, amount })
    currentWeekStart = startOfWeek(new Date(clampedEnd.getTime() + 86400000), { weekStartsOn: 1 })
    weekIndex += 1
    if (weekIndex > 6) break
  }

  void days
  return weeks
}

export function averageDailySpend(expenses: Expense[], monthDate: Date) {
  const monthExpenses = filterByMonth(expenses, monthDate)
  const daysElapsed = Math.max(
    1,
    differenceInCalendarDays(new Date(), startOfMonth(monthDate)) + 1,
  )
  return sum(monthExpenses) / daysElapsed
}

export function highestSpendingDay(expenses: Expense[]) {
  const map = new Map<string, number>()
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount)
  }
  let best: { date: string; amount: number } | null = null
  for (const [date, amount] of map.entries()) {
    if (!best || amount > best.amount) best = { date, amount }
  }
  return best
}

export function highestSpendingCategory(expenses: Expense[]) {
  const breakdown = categoryBreakdown(expenses)
  return breakdown[0] ?? null
}

export function mostUsedPaymentMethod(expenses: Expense[]) {
  const breakdown = paymentMethodBreakdown(expenses)
  return breakdown[0] ?? null
}

export function averageTransactionSize(expenses: Expense[]) {
  if (expenses.length === 0) return 0
  return sum(expenses) / expenses.length
}

export function monthlyGrowth(currentMonth: Expense[], previousMonth: Expense[]) {
  const prev = sum(previousMonth)
  const curr = sum(currentMonth)
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 100)
}

export function regretExpenses(expenses: Expense[], threshold = 1500) {
  return expenses
    .filter((e) => e.type === 'want' && e.amount >= threshold)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
}

export function formatMonthLabel(date: Date) {
  return format(date, 'MMMM yyyy')
}
