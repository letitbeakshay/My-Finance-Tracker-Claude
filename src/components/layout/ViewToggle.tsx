import { motion } from 'framer-motion'

export type View = 'enter' | 'data'

const OPTIONS: { value: View; label: string }[] = [
  { value: 'enter', label: 'Enter expenses' },
  { value: 'data', label: 'All data' },
]

interface ViewToggleProps {
  value: View
  onChange: (view: View) => void
}

/** Sticky top bar holding the Enter expenses / All data switch. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      className="sticky top-0 z-[60] bg-bg/90 backdrop-blur-xl px-4 pb-2.5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
    >
      <div className="relative flex bg-surface border border-border rounded-2xl p-1 max-w-[380px] mx-auto">
        {OPTIONS.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className="relative flex-1 h-10 rounded-xl text-[14px] font-semibold z-10 transition-colors"
              style={{ color: active ? '#000' : '#9a9a9a' }}
            >
              {active && (
                <motion.div
                  layoutId="view-toggle-bg"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-xl -z-10 bg-accent"
                />
              )}
              <span className="relative">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
