import { addMonths, isSameMonth, subMonths } from 'date-fns'
import { formatMonthLabel } from '../../lib/analytics'

interface MonthNavProps {
  month: Date
  onChange: (month: Date) => void
  className?: string
}

export function MonthNav({ month, onChange, className }: MonthNavProps) {
  const isCurrentMonth = isSameMonth(month, new Date())

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(subMonths(month, 1))}
        className="w-10 h-10 flex items-center justify-center text-tertiary hover:text-white"
        aria-label="Previous month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className={className ?? 'text-[26px] font-bold tracking-tight min-w-[180px] text-center sm:text-left'}>
        {formatMonthLabel(month)}
      </h1>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        disabled={isCurrentMonth}
        className="w-10 h-10 flex items-center justify-center text-tertiary hover:text-white disabled:opacity-30"
        aria-label="Next month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
