import { useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { tryUnlock } from '../../lib/auth'
import { VERSES } from '../../lib/scripture'

interface PasscodeGateProps {
  onUnlock: () => void
}

export function PasscodeGate({ onUnlock }: PasscodeGateProps) {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (tryUnlock(value)) {
      onUnlock()
      return
    }
    setValue('')
    setShake((n) => n + 1)
    inputRef.current?.focus()
  }

  return (
    <div className="fixed inset-0 max-w-[560px] mx-auto bg-bg flex flex-col items-center justify-center px-8 gap-6 z-[100]">
      <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-tertiary">
          <rect x="5" y="11" width="14" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="text-center">
        <h1 className="text-white text-[22px] font-bold mb-1">Enter Passcode</h1>
        <p className="text-secondary text-[14px]">Unlock your finance tracker</p>
        <p className="text-tertiary text-[12px] italic mt-4 max-w-[300px] mx-auto leading-relaxed">
          “{VERSES.lords.text}” — {VERSES.lords.ref}
        </p>
      </div>

      <motion.form
        key={shake}
        onSubmit={handleSubmit}
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full flex flex-col gap-3"
      >
        <input
          ref={inputRef}
          autoFocus
          type="password"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passcode"
          className="w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[18px] text-center tracking-[0.3em] placeholder:text-tertiary placeholder:tracking-normal"
        />
        <Button type="submit" disabled={!value}>
          Unlock
        </Button>
      </motion.form>
    </div>
  )
}
