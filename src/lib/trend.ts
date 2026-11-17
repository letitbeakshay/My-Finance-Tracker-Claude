import { format, isSameMonth, parseISO, subMonths } from 'date-fns'

export interface TrendPoint {
  /** Short label for the axis, like "Mar". */
  label: string
  /** Full month, like "March 2026". */
  full: string
  value: number
}

/** The last `count` months (ending with `month`) of a list of dated amounts, oldest first. */
export function monthlyTrend(items: { date: string; amount: number }[], month: Date, count = 6): TrendPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const m = subMonths(month, count - 1 - i)
    return {
      label: format(m, 'MMM'),
      full: format(m, 'MMMM yyyy'),
      value: items.filter((x) => isSameMonth(parseISO(x.date), m)).reduce((s, x) => s + x.amount, 0),
    }
  })
}

/** Change from the month before, in percent; null when there is nothing to compare with. */
export function changePct(points: TrendPoint[], index: number): number | null {
  const prev = points[index - 1]?.value
  if (!prev) return null
  return ((points[index].value - prev) / prev) * 100
}
