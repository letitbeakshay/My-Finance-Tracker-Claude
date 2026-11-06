import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { savingsPlanRepo } from '../../db/repository'
import { usePaymentAccounts } from '../../hooks/useLiveData'
import { SAVINGS_KINDS } from '../../lib/savings'
import type { SavingsKind, SavingsPlan } from '../../types'

const FIELD = 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'
const dec = (v: string) => v.replace(/[^0-9.]/g, '')

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-tertiary text-[13px] pl-1">{label}</span>
      {children}
    </label>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  plan?: SavingsPlan | null
  onSaved?: (plan: SavingsPlan | null) => void
}

/** Add or edit a savings plan: what it is, where it is kept, the target and the monthly amount. */
export function SavingsPlanSheet({ open, onClose, plan, onSaved }: Props) {
  const accounts = usePaymentAccounts()
  const banks = (accounts ?? []).filter((a) => a.type === 'bank_account')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<SavingsKind>('emergency')
  const [accountId, setAccountId] = useState('')
  const [institution, setInstitution] = useState('')
  const [target, setTarget] = useState('')
  const [monthly, setMonthly] = useState('')
  const [opening, setOpening] = useState('')
  const [rate, setRate] = useState('')
  const [start, setStart] = useState('')
  const [maturity, setMaturity] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(plan?.name ?? '')
    setKind(plan?.kind ?? 'emergency')
    setAccountId(plan?.accountId ?? '')
    setInstitution(plan?.institution ?? '')
    setTarget(plan?.target ? String(plan.target) : '')
    setMonthly(plan?.monthly ? String(plan.monthly) : '')
    setOpening(plan?.opening ? String(plan.opening) : '')
    setRate(plan?.interestRate != null ? String(plan.interestRate) : '')
    setStart(plan?.startDate ?? '')
    setMaturity(plan?.maturityDate ?? '')
    setNotes(plan?.notes ?? '')
    setError('')
    setConfirming(false)
  }, [open, plan])

  const canSave = !!name.trim() && !busy

  async function save() {
    if (!canSave) return
    setBusy(true)
    setError('')
    const values = {
      name: name.trim(),
      kind,
      accountId: accountId || undefined,
      institution: accountId ? undefined : institution.trim() || undefined,
      target: parseFloat(target) > 0 ? parseFloat(target) : undefined,
      monthly: parseFloat(monthly) > 0 ? parseFloat(monthly) : undefined,
      opening: parseFloat(opening) > 0 ? parseFloat(opening) : 0,
      interestRate: rate ? parseFloat(rate) : undefined,
      startDate: start || undefined,
      maturityDate: maturity || undefined,
      notes: notes.trim() || undefined,
    }
    try {
      if (plan) {
        await savingsPlanRepo.update(plan, values)
        onSaved?.({ ...plan, ...values })
      } else {
        const created = await savingsPlanRepo.add(values)
        onSaved?.(created)
      }
      onClose()
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!plan) return
    if (!confirming) return setConfirming(true)
    setBusy(true)
    try {
      await savingsPlanRepo.remove(plan.id)
      onSaved?.(null)
      onClose()
    } catch {
      setError('Could not remove it. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-1">{plan ? 'Edit savings plan' : 'New savings plan'}</h2>
      <p className="text-secondary text-[14px] mb-5">Give your savings a name, a place and a goal.</p>

      <div className="flex flex-col gap-3 mb-5">
        <input autoFocus={!plan} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Emergency fund" className={FIELD} />

        <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mt-1">How are you saving?</p>
        <div className="flex flex-wrap gap-2">
          {SAVINGS_KINDS.map((k) => (
            <button key={k.value} type="button" onClick={() => setKind(k.value)} aria-pressed={kind === k.value}
              className={clsx('h-10 px-3.5 rounded-chip border text-[14px] font-medium flex items-center gap-1.5', kind === k.value ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}>
              <span>{k.icon}</span>{k.label}
            </button>
          ))}
        </div>

        <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mt-1">Where is it kept?</p>
        {banks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {banks.map((b) => (
              <button key={b.id} type="button" onClick={() => setAccountId(accountId === b.id ? '' : b.id)} aria-pressed={accountId === b.id}
                className={clsx('h-10 px-3.5 rounded-chip border text-[14px] font-medium', accountId === b.id ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}>
                🏦 {b.label}
              </button>
            ))}
          </div>
        )}
        {!accountId && (
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Bank, post office or fund house, e.g. Canara Bank, Zerodha" className={FIELD} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Labelled label="Target amount">
            <input value={target} onChange={(e) => setTarget(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 300000" className={FIELD} />
          </Labelled>
          <Labelled label="Put in each month">
            <input value={monthly} onChange={(e) => setMonthly(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 5000" className={FIELD} />
          </Labelled>
        </div>
        <Labelled label="Already saved here before you started tracking">
          <input value={opening} onChange={(e) => setOpening(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 50000" className={FIELD} />
        </Labelled>
        <Labelled label="Interest rate (% a year, optional)">
          <input value={rate} onChange={(e) => setRate(dec(e.target.value))} inputMode="decimal" placeholder="e.g. 7.1" className={FIELD} />
        </Labelled>
        <div className="grid grid-cols-2 gap-3">
          <Labelled label="Start date">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={FIELD} />
          </Labelled>
          <Labelled label="Maturity date">
            <input type="date" value={maturity} onChange={(e) => setMaturity(e.target.value)} className={FIELD} />
          </Labelled>
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional), e.g. account or folio number" className={FIELD} />
      </div>

      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <div className="flex gap-3">
        {plan && (
          <Button variant="secondary" onClick={remove} disabled={busy} className="!w-auto px-6 shrink-0 !text-danger">
            {confirming ? 'Tap again' : 'Delete'}
          </Button>
        )}
        <Button onClick={save} disabled={!canSave}>
          {plan ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
      {plan && confirming && <p className="text-tertiary text-[12px] mt-3">Your saved expenses stay; they just stop being linked to this plan.</p>}
    </BottomSheet>
  )
}
