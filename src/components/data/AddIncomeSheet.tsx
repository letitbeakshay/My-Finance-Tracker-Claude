import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { incomeRepo } from '../../db/repository'
import type { PaymentAccount } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

interface AddIncomeSheetProps {
  open: boolean
  onClose: () => void
  bankAccounts: PaymentAccount[]
}

export function AddIncomeSheet({ open, onClose, bankAccounts }: AddIncomeSheetProps) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setSource('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setAccountId('')
      setNotes('')
      setError('')
    }
  }, [open])

  const numericAmount = parseFloat(amount) || 0
  const canSave = !!source.trim() && numericAmount > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      await incomeRepo.add({
        source: source.trim(),
        amount: numericAmount,
        date,
        accountId: accountId || undefined,
        notes: notes.trim() || undefined,
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
      <h2 className="text-white text-[20px] font-bold mb-5">Add income</h2>
      <div className="flex flex-col gap-3 mb-6">
        <input
          autoFocus
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source, e.g. Salary"
          className={FIELD}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder="Amount"
          className={FIELD}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
        {bankAccounts.length > 0 && (
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={FIELD}>
            <option value="">Received in… (optional)</option>
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        )}
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className={FIELD}
        />
      </div>
      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <Button onClick={handleSave} disabled={!canSave}>
        Add income
      </Button>
    </BottomSheet>
  )
}
