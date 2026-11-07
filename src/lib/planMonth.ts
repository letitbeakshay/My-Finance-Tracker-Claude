import { format, parse, subMonths } from 'date-fns'
import type { BudgetItem } from '../types'

export const monthKey = (d: Date) => format(d, 'yyyy-MM')

export const prevMonthKey = (key: string) => monthKey(subMonths(parse(`${key}-01`, 'yyyy-MM-dd', new Date()), 1))

/** Does this plan line apply in the given month (yyyy-MM)? Repeating lines run from their first month until stopped. */
export function appliesInMonth(item: Pick<BudgetItem, 'recurring' | 'startMonth' | 'endMonth'>, key: string) {
  if (!item.recurring) return item.startMonth === key
  return (!item.startMonth || item.startMonth <= key) && (!item.endMonth || item.endMonth >= key)
}

/** The plan lines for one month, in order. */
export function itemsForMonth(items: BudgetItem[] | undefined, month: Date) {
  const key = monthKey(month)
  return (items ?? []).filter((i) => appliesInMonth(i, key))
}
