import { CURRENCIES, getCurrency } from '../../lib/currency'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/** Pick the currency money is shown in (the shadcn Select). */
export function CurrencySelect({ value, onChange, className }: { value?: string; onChange: (code: string) => void; className?: string }) {
  const current = CURRENCIES.find((c) => c.code === (value ?? getCurrency().code))
  return (
    <Select value={current?.code} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger aria-label="Currency" className={className}>
        <SelectValue>{current ? `${current.symbol.trim()} · ${current.code}` : undefined}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.symbol.trim()} · {c.code} · {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
