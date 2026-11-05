import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { VERSES } from '../../lib/scripture'

interface PleasesGodPickerProps {
  /** undefined / null = not answered yet */
  value: boolean | null | undefined
  onChange: (value: boolean) => void
  /** Hide the verse (used where space is tight). */
  compact?: boolean
}

/** "Does this please God?" — answered with every expense, on the category screen. */
export function PleasesGodPicker({ value, onChange, compact }: PleasesGodPickerProps) {
  return (
    <div>
      <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">Does this please God?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={value === true}
          className={clsx(
            'h-14 rounded-2xl border flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors',
            value === true ? 'border-positive text-positive' : 'bg-card border-border text-white',
          )}
          style={value === true ? { background: 'color-mix(in srgb, var(--color-positive) 12%, transparent)' } : undefined}
        >
          <Check size={18} strokeWidth={2.6} /> Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={value === false}
          className={clsx(
            'h-14 rounded-2xl border flex items-center justify-center gap-2 text-[15px] font-semibold transition-colors',
            value === false ? 'border-danger text-danger' : 'bg-card border-border text-white',
          )}
          style={value === false ? { background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)' } : undefined}
        >
          <X size={18} strokeWidth={2.6} /> No
        </button>
      </div>
      {!compact && (
        <p className="text-tertiary text-[12px] italic mt-2.5 leading-relaxed">
          “{VERSES.glory.text}” — {VERSES.glory.ref}
        </p>
      )}
    </div>
  )
}
