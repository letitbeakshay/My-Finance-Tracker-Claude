import { CURRENCIES, getCurrency } from '../../lib/currency'

/** Pick the currency money is shown in. 16px text so phones do not zoom. */
export function CurrencySelect({ value, onChange, className }: { value?: string; onChange: (code: string) => void; className?: string }) {
  return (
    <select
      value={value ?? getCurrency().code}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Currency"
      className={className ?? 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] focus:border-accent outline-none'}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.symbol.trim()} · {c.code} · {c.name}
        </option>
      ))}
    </select>
  )
}
