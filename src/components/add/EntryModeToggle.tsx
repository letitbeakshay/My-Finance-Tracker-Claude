import clsx from 'clsx'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

export type EntryMode = 'expense' | 'income'

/** Switch the entry screen between adding an expense and adding income. */
export function EntryModeToggle({ value, onChange }: { value: EntryMode; onChange: (mode: EntryMode) => void }) {
  return (
    <div role="tablist" aria-label="What are you adding?" className="flex bg-surface border border-border rounded-full p-1">
      {(
        [
          ['expense', 'Expense', ArrowUpRight],
          ['income', 'Income', ArrowDownLeft],
        ] as const
      ).map(([mode, label, Icon]) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          className={clsx(
            'flex-1 h-10 rounded-full text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors',
            value === mode ? 'bg-primary text-on-primary' : 'text-secondary',
          )}
        >
          <Icon size={16} strokeWidth={2.4} /> {label}
        </button>
      ))}
    </div>
  )
}
