import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { expenseRepo, incomeRepo } from '../../db/repository'
import { useAllCategories, useExpenses } from '../../hooks/useLiveData'
import { pendingReimbursements, reimbursableIds } from '../../lib/reimbursement'
import { formatCurrency } from '../../lib/currency'
import { VERSES } from '../../lib/scripture'
import type { PaymentAccount } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

interface AddIncomeSheetProps {
  open: boolean
  onClose: () => void
  bankAccounts: PaymentAccount[]
  givingPercent: number
  /** Lets the user go straight to recording what they set aside to give. */
  onGive?: (amount: number) => void
}

export function AddIncomeSheet({ open, onClose, bankAccounts, givingPercent, onGive }: AddIncomeSheetProps) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAmount, setSavedAmount] = useState<number | null>(null)
  const [isReimb, setIsReimb] = useState(false)
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [paidBack, setPaidBack] = useState<number | null>(null)
  const expenses = useExpenses()
  const categories = useAllCategories()
  const pending = useMemo(
    () => pendingReimbursements(expenses ?? [], reimbursableIds(categories ?? [])).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, categories],
  )
  const tickedTotal = pending.filter((e) => ticked.has(e.id)).reduce((s, e) => s + e.amount, 0)

  useEffect(() => {
    if (open) {
      setSource('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setAccountId('')
      setNotes('')
      setError('')
      setSavedAmount(null)
      setIsReimb(false)
      setTicked(new Set())
      setPaidBack(null)
    }
  }, [open])

  const numericAmount = parseFloat(amount) || 0
  const canSave = (isReimb ? ticked.size > 0 || !!source.trim() : !!source.trim()) && numericAmount > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      if (isReimb) {
        await expenseRepo.settleReimbursements(pending.filter((e) => ticked.has(e.id)), { amount: numericAmount, date, accountId: accountId || undefined })
        setPaidBack(numericAmount)
        return
      }
      await incomeRepo.add({
        source: source.trim(),
        amount: numericAmount,
        date,
        accountId: accountId || undefined,
        notes: notes.trim() || undefined,
      })
      setSavedAmount(numericAmount)
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      {paidBack !== null ? (
        <>
          <h2 className="text-white text-[20px] font-bold mb-1">Paid back</h2>
          <p className="text-secondary text-[15px] mb-5">
            {formatCurrency(paidBack)} recorded as money returned. It is not counted as income, so your first fruits stay right.
          </p>
          <Button onClick={onClose}>Done</Button>
        </>
      ) : savedAmount !== null ? (
        <FirstFruitsPrompt
          firstFruits={(savedAmount * givingPercent) / 100}
          givingPercent={givingPercent}
          onDone={onClose}
          onGive={onGive}
        />
      ) : (
        <>
      <h2 className="text-white text-[20px] font-bold mb-4">Add income</h2>
      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mb-2">Is this money paid back to you?</p>
          <div className="grid grid-cols-2 gap-2">
            {([[false, 'No, it is income'], [true, 'Yes, a reimbursement']] as const).map(([v, label]) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setIsReimb(v)}
                aria-pressed={isReimb === v}
                className={clsx('h-12 rounded-2xl border text-[14px] font-semibold', isReimb === v ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {isReimb && (
        <div className="mb-4">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mb-2">Which expenses did it cover?</p>
          <div className="flex flex-col gap-2 max-h-[28dvh] overflow-y-auto">
            {pending.map((e) => {
              const on = ticked.has(e.id)
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    const next = new Set(ticked)
                    if (on) next.delete(e.id)
                    else next.add(e.id)
                    setTicked(next)
                    const total = pending.filter((x) => next.has(x.id)).reduce((s, x) => s + x.amount, 0)
                    setAmount(total ? String(Math.round(total * 100) / 100) : '')
                    if (!source.trim()) setSource('Reimbursement')
                  }}
                  className={clsx('flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left', on ? 'bg-accent-soft border-accent' : 'bg-surface border-border')}
                >
                  <span className={clsx('w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0', on ? 'bg-positive border-positive text-on-type' : 'border-border bg-card')}>
                    {on && <Check size={15} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-white text-[14px] font-medium truncate">{e.notes || 'Reimbursable expense'}</span>
                    <span className="block text-tertiary text-[12px]">{format(new Date(e.date), 'd MMM')}</span>
                  </span>
                  <span className="text-white text-[14px] font-semibold tabular-nums">{formatCurrency(e.amount)}</span>
                </button>
              )
            })}
          </div>
          {ticked.size > 0 && numericAmount !== tickedTotal && (
            <p className="text-warning text-[12px] mt-2">You ticked {formatCurrency(tickedTotal)} but entered {formatCurrency(numericAmount)}. Check the amount.</p>
          )}
        </div>
      )}
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
        {isReimb ? 'Record money paid back' : 'Add income'}
      </Button>
        </>
      )}
    </BottomSheet>
  )
}

function FirstFruitsPrompt({
  firstFruits,
  givingPercent,
  onDone,
  onGive,
}: {
  firstFruits: number
  givingPercent: number
  onDone: () => void
  onGive?: (amount: number) => void
}) {
  return (
    <>
      <h2 className="text-white text-[20px] font-bold mb-1">Income recorded</h2>
      <p className="text-secondary text-[15px] mb-5">Thank you, Lord, for providing.</p>
      {givingPercent > 0 && (
        <div className="bg-giving-soft border border-giving/30 rounded-2xl p-4 mb-5">
          <p className="text-giving text-[13px] font-semibold uppercase tracking-wide mb-1">First fruits</p>
          <p className="text-white text-[24px] font-bold tabular-nums mb-2">{formatCurrency(firstFruits)}</p>
          <p className="text-secondary text-[14px] italic">
            “{VERSES.firstFruits.text}” — {VERSES.firstFruits.ref}
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onDone}>
          Done
        </Button>
        {givingPercent > 0 && onGive && (
          <Button
            onClick={() => {
              onDone()
              onGive(firstFruits)
            }}
          >
            Give now
          </Button>
        )}
      </div>
    </>
  )
}
