import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { loanRepo } from '../../db/repository'
import { emiFor, loanStats } from '../../lib/loanMath'
import { formatCurrency } from '../../lib/currency'
import type { Loan, LoanKind } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

const KIND_OPTIONS: { value: LoanKind; label: string; color: string }[] = [
  { value: 'borrowed', label: 'I borrowed', color: 'var(--color-want)' },
  { value: 'lent', label: 'I lent', color: 'var(--color-need)' },
]

const dec = (v: string) => v.replace(/[^0-9.]/g, '')
const int = (v: string) => v.replace(/[^0-9]/g, '')

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-tertiary text-[13px] pl-1">{label}</span>
      {children}
    </label>
  )
}

interface AddLoanSheetProps {
  open: boolean
  onClose: () => void
  /** When set, the sheet edits this loan instead of adding one. */
  loan?: Loan | null
}

/** Add a loan, or edit one: amount, interest, EMI and how much is already paid, with the pending amount worked out live. */
export function AddLoanSheet({ open, onClose, loan }: AddLoanSheetProps) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<LoanKind>('borrowed')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [tenure, setTenure] = useState('')
  const [emi, setEmi] = useState('')
  const [emisPaid, setEmisPaid] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(loan?.name ?? '')
    setKind(loan?.kind ?? 'borrowed')
    setPrincipal(loan ? String(loan.principal) : '')
    setRate(loan?.interestRate != null ? String(loan.interestRate) : '')
    setTenure(loan?.tenureMonths != null ? String(loan.tenureMonths) : '')
    setEmi(loan?.emi ? String(loan.emi) : '')
    setEmisPaid(loan?.emisPaid ? String(loan.emisPaid) : '')
    setAmountPaid(loan && !loan.emisPaid && loan.paid ? String(loan.paid) : '')
    setNextDueDate(loan?.nextDueDate ?? '')
    setError('')
  }, [open, loan])

  const P = parseFloat(principal) || 0
  const R = parseFloat(rate) || 0
  const T = parseInt(tenure) || 0
  const typedEmi = parseFloat(emi) || 0
  const autoEmi = P > 0 && T > 0 ? Math.round(emiFor(P, R, T)) : 0
  const K = parseInt(emisPaid) || 0

  const draft = useMemo(
    () => ({
      principal: P,
      paid: parseFloat(amountPaid) || 0,
      emi: typedEmi || autoEmi || undefined,
      interestRate: R || undefined,
      tenureMonths: T || undefined,
      emisPaid: K,
      nextDueDate: nextDueDate || undefined,
    }),
    [P, amountPaid, typedEmi, autoEmi, R, T, K, nextDueDate],
  )
  const stats = useMemo(() => loanStats(draft), [draft])
  const canSave = !!name.trim() && P > 0 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const input = {
        name: name.trim(),
        kind,
        principal: P,
        paid: Math.min(P, stats.hasPlan ? stats.principalPaid : draft.paid),
        emi: draft.emi,
        interestRate: draft.interestRate,
        tenureMonths: draft.tenureMonths,
        emisPaid: K,
        nextDueDate: draft.nextDueDate,
        schedule: null,
      }
      if (loan) await loanRepo.update(loan, input)
      else await loanRepo.add(input)
      onClose()
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">{loan ? 'Edit loan' : 'Add loan'}</h2>
      <div className="mb-4">
        <SegmentedControl options={KIND_OPTIONS} value={kind} onChange={setKind} />
      </div>
      <div className="flex flex-col gap-3 mb-5">
        <input autoFocus={!loan} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Home loan — PNB" className={FIELD} />
        <Labelled label="Loan amount (the amount you took)">
          <input value={principal} onChange={(e) => setPrincipal(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 900000" className={FIELD} />
        </Labelled>
        <div className="grid grid-cols-2 gap-3">
          <Labelled label="Interest rate (% a year)">
            <input value={rate} onChange={(e) => setRate(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 8.5" className={FIELD} />
          </Labelled>
          <Labelled label="Total months (tenure)">
            <input value={tenure} onChange={(e) => setTenure(int(e.target.value))} inputMode="numeric" placeholder="e.g. 240" className={FIELD} />
          </Labelled>
        </div>
        <Labelled label={autoEmi && !typedEmi ? `Monthly EMI (worked out: ${formatCurrency(autoEmi)})` : 'Monthly EMI'}>
          <input value={emi} onChange={(e) => setEmi(dec(e.target.value))} inputMode="decimal" placeholder={autoEmi ? String(autoEmi) : 'e.g. 11598'} className={FIELD} />
        </Labelled>
        <Labelled label="How many EMIs have you already paid?">
          <input value={emisPaid} onChange={(e) => setEmisPaid(int(e.target.value))} inputMode="numeric" placeholder="e.g. 14" className={FIELD} />
        </Labelled>
        {!stats.hasPlan && (
          <Labelled label="Or the amount already paid (no EMI plan)">
            <input value={amountPaid} onChange={(e) => setAmountPaid(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 50000" className={FIELD} />
          </Labelled>
        )}
        <Labelled label="Next EMI due date">
          <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={FIELD} />
        </Labelled>
      </div>

      {loan?.schedule && (
        <p className="text-warning text-[13px] mb-4 leading-relaxed">
          This loan uses your lender’s uploaded schedule. Saving here replaces it with one calculated from these numbers.
        </p>
      )}

      {P > 0 && (
        <div className="rounded-2xl bg-card border border-border p-4 mb-5">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">Worked out for you</p>
          <p className="text-white text-[24px] font-bold tabular-nums mt-1">
            {formatCurrency(stats.hasPlan ? stats.outstanding : Math.max(0, P - draft.paid))}
            <span className="text-tertiary text-[14px] font-medium"> still to pay</span>
          </p>
          {stats.hasPlan && (
            <p className="text-secondary text-[13px] mt-1 leading-relaxed">
              {stats.remainingEmis != null && `${stats.remainingEmis} EMIs left`}
              {stats.remainingInterest != null && ` · ${formatCurrency(stats.remainingInterest)} interest still to come`}
              {stats.payoffDate && ` · clears ${format(parseISO(stats.payoffDate), 'MMM yyyy')}`}
              {stats.remainingEmis == null && 'This EMI is too small to clear the loan at that rate.'}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <Button onClick={handleSave} disabled={!canSave}>
        {loan ? 'Save changes' : 'Add loan'}
      </Button>
    </BottomSheet>
  )
}
