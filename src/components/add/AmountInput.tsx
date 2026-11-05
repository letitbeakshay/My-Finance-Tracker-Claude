import { useRef, useEffect } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
}

/** The big amount. The ₹ and the number are centred together and the field hugs what is typed. */
export function AmountInput({ value, onChange }: AmountInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  function handleChange(raw: string) {
    let next = raw.replace(/[^0-9.]/g, '')
    const parts = next.split('.')
    if (parts.length > 2) next = `${parts[0]}.${parts[1]}`
    if (parts[1]?.length > 2) next = `${parts[0]}.${parts[1].slice(0, 2)}`
    onChange(next)
  }

  const length = Math.max(1, value.length)
  // Long amounts shrink a little so they always fit on a phone.
  const size = length > 9 ? 40 : length > 7 ? 48 : length > 5 ? 56 : 68

  return (
    <div
      className="flex flex-col items-center justify-center pt-6 pb-8 cursor-text"
      onClick={() => ref.current?.focus()}
    >
      <p className="text-tertiary text-[13px] font-medium uppercase tracking-wide mb-3">Amount</p>
      <div className="flex items-baseline justify-center gap-1.5 max-w-full">
        <span className="text-tertiary font-semibold leading-none" style={{ fontSize: size * 0.55 }}>
          ₹
        </span>
        <input
          ref={ref}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          autoComplete="off"
          aria-label="Amount"
          style={{ width: `${length}ch`, minWidth: '1ch', maxWidth: '100%', fontSize: size }}
          className="bg-transparent text-white font-display font-bold leading-none tracking-tight text-center tabular-nums placeholder:text-tertiary/60"
        />
      </div>
    </div>
  )
}
