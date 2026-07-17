import { useRef, useEffect } from 'react'

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
}

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

  return (
    <div className="flex items-center justify-center py-10">
      <span className="text-accent text-[44px] font-bold mr-1 self-start mt-2">₹</span>
      <input
        ref={ref}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        inputMode="decimal"
        placeholder="0"
        autoComplete="off"
        className="bg-transparent text-white text-[64px] font-bold tracking-tight w-full max-w-[280px] text-left tabular-nums placeholder:text-tertiary"
      />
    </div>
  )
}
