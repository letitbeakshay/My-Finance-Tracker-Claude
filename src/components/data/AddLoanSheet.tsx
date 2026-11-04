import { useEffect, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { loanRepo } from '../../db/repository'
import type { LoanKind } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

const KIND_OPTIONS: { value: LoanKind; label: string; color: string }[] = [
  { value: 'borrowed', label: 'I borrowed', color: '#ff9f43' },
  { value: 'lent', label: 'I lent', color: '#5b9dff' },
]

interface AddLoanSheetProps {
  open: boolean
  onClose: () => void
}

export function AddLoanSheet({ open, onClose }: AddLoanSheetProps) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<LoanKind>('borrowed')
  const [principal, setPrincipal] = useState('')
  const [emi, setEmi] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setKind('borrowed')
      setPrincipal('')
      setEmi('')
      setNextDueDate('')
      setError('')
    }
  }, [open])

  const numericPrincipal = parseFloat(principal) || 0
  const canSave = !!name.trim() && numericPrincipal > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await loanRepo.add({
        name: name.trim(),
        kind,
        principal: numericPrincipal,
        emi: parseFloat(emi) > 0 ? parseFloat(emi) : undefined,
        nextDueDate: nextDueDate || undefined,
      })
      onClose()
    } catch {
      setError('Could not save. Make sure the latest supabase/schema.sql has been run.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">Add loan</h2>
      <div className="mb-4">
        <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </div>
      <div className="flex flex-col gap-3 mb-6">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, e.g. Car loan — HDFC"
          className={FIELD}
        />
        <input
          value={principal}
          onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder="Total amount"
          className={FIELD}
        />
        <input
          value={emi}
          onChange={(e) => setEmi(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder="Monthly EMI (optional)"
          className={FIELD}
        />
        <label className="text-tertiary text-[13px] -mb-1.5 pl-1">Next due date (optional)</label>
        <input
          type="date"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
          className={FIELD}
        />
      </div>
      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <Button onClick={handleSave} disabled={!canSave}>
        Add loan
      </Button>
    </BottomSheet>
  )
}
