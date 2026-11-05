import { motion } from 'framer-motion'

interface Option<T extends string> {
  value: T
  label: string
  color?: string
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="relative flex bg-surface border border-border rounded-2xl p-1.5">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative flex-1 h-11 rounded-xl text-[15px] font-semibold z-10"
            style={{ color: active ? '#000' : 'var(--color-secondary)' }}
          >
            {active && (
              <motion.div
                layoutId="segmented-bg"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-xl -z-10"
                style={{ background: opt.color ?? '#87c696' }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
