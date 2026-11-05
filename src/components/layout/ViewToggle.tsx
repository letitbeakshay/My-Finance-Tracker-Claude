import { motion } from 'framer-motion'
import { ThemeToggle } from '../ui/ThemeToggle'

export type View = 'enter' | 'data'

const OPTIONS: { value: View; label: string }[] = [
  { value: 'enter', label: 'Expense' },
  { value: 'data', label: 'Dashboard' },
]

interface ViewToggleProps {
  value: View
  onChange: (view: View) => void
}

/** Sticky top bar with the Expense / Dashboard switch. Desktop only; phones use MobileNav. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="hidden md:block sticky top-0 z-[60] bg-bg/90 backdrop-blur-xl px-4 pb-2.5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
    >
      <div className="grid grid-cols-[1fr_380px_1fr] items-center">
      <div />
      <div className="relative flex bg-surface border border-border rounded-2xl p-1">
        {OPTIONS.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="relative flex-1 h-10 rounded-xl text-[14px] font-semibold z-10 transition-colors"
              style={{ color: active ? 'var(--color-on-primary)' : 'var(--color-secondary)' }}
            >
              {active && (
                <motion.div
                  layoutId="view-toggle-bg"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-xl -z-10 bg-primary"
                />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <ThemeToggle className="justify-self-end" />
      </div>
    </div>
  )
}
