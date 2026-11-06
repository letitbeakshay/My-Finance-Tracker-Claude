import { useEffect, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { paymentAccountRepo } from '../../db/repository'
import type { PaymentAccount, PaymentAccountType } from '../../types'

const TYPE_OPTIONS: { value: PaymentAccountType; label: string; color: string }[] = [
  { value: 'bank_account', label: 'Bank', color: 'var(--color-need)' },
  { value: 'debit_card', label: 'Debit card', color: 'var(--color-savings)' },
  { value: 'credit_card', label: 'Credit card', color: 'var(--color-want)' },
]

const ICON_BY_TYPE: Record<PaymentAccountType, string> = {
  bank_account: '🏦',
  debit_card: '💳',
  credit_card: '💳',
}

const FIELD = 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'
const dec = (v: string) => v.replace(/[^0-9.]/g, '')
const day = (v: string) => v.replace(/[^0-9]/g, '').slice(0, 2)

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-tertiary text-[13px] pl-1">{label}</span>
      {children}
    </label>
  )
}

interface NewPaymentAccountSheetProps {
  open: boolean
  onClose: () => void
  onSaved: (account: PaymentAccount) => void
  initial?: PaymentAccount
  defaultType?: PaymentAccountType
  /** Shows a Delete button when editing. Cards with expenses are hidden instead, so history stays. */
  onDelete?: () => Promise<void>
}

/** Add or edit a bank account, debit card or credit card. Credit cards also ask for interest, limit and bill dates. */
export function NewPaymentAccountSheet({ open, onClose, onSaved, initial, defaultType, onDelete }: NewPaymentAccountSheetProps) {
  const [confirming, setConfirming] = useState(false)
  const [label, setLabel] = useState('')
  const [type, setType] = useState<PaymentAccountType>('bank_account')
  const [bankName, setBankName] = useState('')
  const [last4, setLast4] = useState('')
  const [rate, setRate] = useState('')
  const [limit, setLimit] = useState('')
  const [statementDay, setStatementDay] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label ?? '')
    setType(initial?.type ?? defaultType ?? 'bank_account')
    setBankName(initial?.bankName ?? '')
    setLast4(initial?.last4 ?? '')
    setRate(initial?.interestRate != null ? String(initial.interestRate) : '')
    setLimit(initial?.creditLimit != null ? String(initial.creditLimit) : '')
    setStatementDay(initial?.statementDay != null ? String(initial.statementDay) : '')
    setDueDay(initial?.dueDay != null ? String(initial.dueDay) : '')
    setError('')
    setConfirming(false)
  }, [open, initial, defaultType])

  const credit = type === 'credit_card'
  const dayOk = (v: string) => !v || (parseInt(v) >= 1 && parseInt(v) <= 31)
  const canSave = !!label.trim() && dayOk(statementDay) && dayOk(dueDay) && !busy

  async function handleSave() {
    if (!canSave) return
    setBusy(true)
    setError('')
    const payload = {
      label: label.trim(),
      type,
      bankName: bankName.trim() || undefined,
      last4: last4.trim() || undefined,
      interestRate: credit && parseFloat(rate) >= 0 && rate ? parseFloat(rate) : undefined,
      creditLimit: credit && parseFloat(limit) > 0 ? parseFloat(limit) : undefined,
      statementDay: credit && statementDay ? parseInt(statementDay) : undefined,
      dueDay: credit && dueDay ? parseInt(dueDay) : undefined,
      icon: ICON_BY_TYPE[type],
    }
    try {
      if (initial) {
        await paymentAccountRepo.update(initial.id, payload)
        onSaved({ ...initial, ...payload })
      } else {
        onSaved(await paymentAccountRepo.add(payload))
      }
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">{initial ? 'Edit card or account' : 'Add card or account'}</h2>

      <div className="mb-5">
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <input
          autoFocus={!initial}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={credit ? 'e.g. HDFC Regalia' : type === 'debit_card' ? 'e.g. SBI Debit Card' : 'e.g. SBI Savings'}
          className={FIELD}
        />
        <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name (optional)" className={FIELD} />
        <input
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="Last 4 digits (optional)"
          className={FIELD}
        />
        {credit && (
          <>
            <Labelled label="Interest rate on unpaid bills (% a year, usually 36 to 42)">
              <input value={rate} onChange={(e) => setRate(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 42" className={FIELD} />
            </Labelled>
            <Labelled label="Credit limit">
              <input value={limit} onChange={(e) => setLimit(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 100000" className={FIELD} />
            </Labelled>
            <div className="grid grid-cols-2 gap-3">
              <Labelled label="Bill date (day of month)">
                <input value={statementDay} onChange={(e) => setStatementDay(day(e.target.value))} inputMode="numeric" placeholder="e.g. 15" className={FIELD} />
              </Labelled>
              <Labelled label="Due date (day of month)">
                <input value={dueDay} onChange={(e) => setDueDay(day(e.target.value))} inputMode="numeric" placeholder="e.g. 5" className={FIELD} />
              </Labelled>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <Button onClick={handleSave} disabled={!canSave}>
        {initial ? 'Save changes' : 'Add'}
      </Button>
      {initial && onDelete && (
        <Button
          variant="secondary"
          className="mt-3 !text-danger"
          disabled={busy}
          onClick={async () => {
            if (!confirming) return setConfirming(true)
            setBusy(true)
            try {
              await onDelete()
            } finally {
              setBusy(false)
            }
          }}
        >
          {confirming ? 'Tap again to remove (past expenses stay)' : 'Remove'}
        </Button>
      )}
    </BottomSheet>
  )
}
