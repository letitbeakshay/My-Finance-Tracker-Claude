import { addMonths, subMonths } from 'date-fns'
import { formatMonthLabel } from '../../lib/analytics'

interface MonthSelectorProps {
  month: Date
  onChange: (date: Date) => void
}

export function MonthSelector({ month, onChange }: MonthSelectorProps) {
  const isCurrentMonth =
    month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  return (
    <div className="flex items-center justify-between mb-7">
      <button
        type="button"
        onClick={() => onChange(subMonths(month, 1))}
        className="w-10 h-10 flex items-center justify-center text-tertiary"
        aria-label="Previous month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="text-[19px] font-bold">{formatMonthLabel(month)}</h1>
      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        disabled={isCurrentMonth}
        className="w-10 h-10 flex items-center justify-center text-tertiary disabled:opacity-30"
        aria-label="Next month"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
