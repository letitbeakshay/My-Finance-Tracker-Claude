import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { Check, ChevronLeft, FileUp, Loader2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AddLoanSheet } from './AddLoanSheet'
import { loanRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import { buildSchedule, loanStats, runningBalances } from '../../lib/loanMath'
import { markPaidUpTo, readSchedulePdf, type ParsedSchedule } from '../../lib/scheduleImport'
import type { Loan } from '../../types'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
      <p className="text-tertiary text-[11px] font-medium">{label}</p>
      <p className="text-white text-[15px] font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
  )
}

type View = 'upcoming' | 'paid' | 'all'
const COLS = 'md:grid-cols-[44px_52px_104px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]'

/** A loan on its own page: where it stands and the full repayment schedule, with a tick on every month paid. */
export function LoanDetailPage({ loan, onBack }: { loan: Loan; onBack: () => void }) {
  const stats = useMemo(() => loanStats(loan), [loan])
  const rows = useMemo(() => buildSchedule(loan), [loan])
  const balances = useMemo(() => runningBalances(loan.principal, rows), [loan.principal, rows])
  const [view, setView] = useState<View>('upcoming')
  const [busyN, setBusyN] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState<'delete' | 'recalc' | null>(null)
  const [pending, setPending] = useState<ParsedSchedule | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [loan.id])

  const paidCount = rows.filter((r) => r.paid).length
  const shown = rows.map((r, i) => ({ r, balance: balances[i] })).filter(({ r }) => (view === 'all' ? true : view === 'paid' ? r.paid : !r.paid))

  async function tick(n: number, paid: boolean) {
    setBusyN(n)
    setError('')
    try {
      await loanRepo.setInstallmentPaid(loan, n, paid)
    } catch {
      setError('Could not save the tick. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusyN(null)
    }
  }

  async function pick(file: File | undefined) {
    if (!file) return
    setReading(true)
    setError('')
    try {
      setPending(await readSchedulePdf(file))
    } catch {
      setError('I could not find a repayment schedule in that PDF. Use the amortisation schedule PDF from your lender.')
    } finally {
      setReading(false)
    }
  }

  async function useUploaded() {
    if (!pending) return
    setBusy(true)
    setError('')
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const sched = markPaidUpTo(pending.rows, today)
      const principal = Math.round(pending.rows.reduce((s, r) => s + r.principal, 0))
      const emi = Math.max(...pending.rows.map((r) => r.emi))
      await loanRepo.saveSchedule(loan, sched, {
        principal: principal > 0 ? principal : loan.principal,
        emi,
        interestRate: pending.interestRate ?? loan.interestRate,
        tenureMonths: pending.tenureMonths ?? loan.tenureMonths,
      })
      setPending(null)
    } catch {
      setError('Could not save the schedule. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  async function run(kind: 'delete' | 'recalc') {
    if (confirming !== kind) return setConfirming(kind)
    setBusy(true)
    try {
      if (kind === 'delete') {
        await loanRepo.remove(loan.id)
        onBack()
      } else {
        await loanRepo.recalculateSchedule(loan)
        setConfirming(null)
      }
    } finally {
      setBusy(false)
    }
  }

  const pct = loan.principal > 0 ? Math.min(100, (stats.principalPaid / loan.principal) * 100) : 0
  const color = loan.kind === 'borrowed' ? 'var(--color-want)' : 'var(--color-need)'
  const uploadedSummary = pending && {
    count: pending.rows.length,
    first: pending.rows[0]?.date,
    last: pending.rows.at(-1)?.date,
    principal: pending.rows.reduce((s, r) => s + r.principal, 0),
    interest: pending.rows.reduce((s, r) => s + r.interest, 0),
    paidNow: markPaidUpTo(pending.rows, format(new Date(), 'yyyy-MM-dd')).filter((r) => r.paid).length,
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="h-11 pl-2 pr-4 -ml-2 mb-3 rounded-xl flex items-center gap-1 text-secondary text-[15px] font-medium">
        <ChevronLeft size={20} /> Back to loans
      </button>

      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[400px_minmax(0,1fr)] items-start">
        {/* Where it stands */}
        <div className="flex flex-col gap-5 min-w-0">
          <Card>
            <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">{loan.kind === 'borrowed' ? 'You owe' : 'Owed to you'}</p>
            <h2 className="text-white text-[22px] font-bold mt-0.5">{loan.name}</h2>
            <p className="text-white text-[34px] font-bold tabular-nums leading-none mt-3">
              {formatCurrency(stats.outstanding)}
              <span className="text-tertiary text-[15px] font-medium"> pending</span>
            </p>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden mt-4">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <p className="text-tertiary text-[12px] mt-1.5 tabular-nums">
              {formatCurrency(stats.principalPaid)} of {formatCurrency(loan.principal)} paid back
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {stats.hasPlan && (
                <>
                  <Fact label="EMIs paid" value={stats.totalEmis ? `${stats.emisPaid} of ${stats.totalEmis}` : String(stats.emisPaid)} />
                  <Fact label="EMIs left" value={stats.remainingEmis != null ? String(stats.remainingEmis) : '—'} />
                  <Fact label="Monthly EMI" value={formatCurrency(Math.round(stats.emi))} />
                  <Fact label="Interest rate" value={loan.interestRate ? `${loan.interestRate}% a year` : 'none'} />
                  <Fact label="Paid so far" value={formatCurrency(stats.totalPaid)} />
                  <Fact label="Interest paid" value={formatCurrency(stats.interestPaid)} />
                  {stats.remainingPayable != null && <Fact label="Still to pay" value={formatCurrency(stats.remainingPayable)} />}
                  {stats.remainingInterest != null && <Fact label="Interest to come" value={formatCurrency(stats.remainingInterest)} />}
                  {stats.totalInterest != null && <Fact label="Total interest" value={formatCurrency(stats.totalInterest)} />}
                  {stats.payoffDate && <Fact label="Loan clears" value={format(parseISO(stats.payoffDate), 'MMM yyyy')} />}
                </>
              )}
              {loan.nextDueDate && !loan.closed && <Fact label="Next EMI due" value={format(parseISO(loan.nextDueDate), 'd MMM yyyy')} />}
            </div>
            {!stats.hasPlan && <p className="text-tertiary text-[13px] mt-4">Add the interest rate and EMI (Edit details), or upload your lender’s schedule, to see the repayment schedule.</p>}
          </Card>

          <div className="flex flex-col gap-3">
            {!loan.closed && stats.hasPlan && (
              <Button onClick={() => loanRepo.recordEmi(loan)} disabled={busy}>
                I paid this month’s EMI
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEditing(true)} disabled={busy}>
                Edit details
              </Button>
              <Button variant="secondary" className="!text-danger" onClick={() => run('delete')} disabled={busy}>
                {confirming === 'delete' ? 'Tap again to delete' : 'Delete loan'}
              </Button>
            </div>
          </div>
        </div>

        {/* Repayment schedule */}
        <Card padded={false} className="min-w-0 overflow-hidden">
          <div className="p-5 pb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-white text-[18px] font-bold">Repayment schedule</h3>
              <p className="text-tertiary text-[12px]">
                {rows.length ? `${paidCount} of ${rows.length} paid · tick a month to mark it paid` : 'Nothing to show yet'}
                {loan.schedule ? ' · from your lender’s PDF' : rows.length ? ' · calculated from your details' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={reading} className="h-10 px-3.5 rounded-xl border border-border bg-surface text-white text-[14px] font-semibold flex items-center gap-2">
                {reading ? <Loader2 size={15} className="animate-spin" /> : <FileUp size={15} />} Upload reschedule PDF
              </button>
              {loan.schedule && (
                <button type="button" onClick={() => run('recalc')} disabled={busy} className="h-10 px-3.5 rounded-xl border border-border bg-surface text-white text-[14px] font-semibold">
                  {confirming === 'recalc' ? 'Tap again to replace the PDF schedule' : 'Calculate manually'}
                </button>
              )}
            </div>
          </div>

          {uploadedSummary && (
            <div className="mx-5 mb-4 rounded-2xl border border-accent bg-accent-soft p-4">
              <p className="text-accent-ink text-[15px] font-semibold">Found {uploadedSummary.count} instalments</p>
              <p className="text-secondary text-[13px] mt-1 leading-relaxed">
                {uploadedSummary.first && format(parseISO(uploadedSummary.first), 'MMM yyyy')} to {uploadedSummary.last && format(parseISO(uploadedSummary.last), 'MMM yyyy')}
                {pending?.interestRate ? ` · ${pending.interestRate}% a year` : ''} · principal {formatCurrency(uploadedSummary.principal)} · interest {formatCurrency(uploadedSummary.interest)}.
                {' '}Instalments due up to today ({uploadedSummary.paidNow}) will be ticked as paid; you can change any tick after.
                The loan amount becomes {formatCurrency(Math.round(uploadedSummary.principal))}.
              </p>
              <div className="flex gap-3 mt-3">
                <Button className="!h-11 !text-[15px]" onClick={useUploaded} disabled={busy}>
                  {busy ? 'Saving…' : 'Use this schedule'}
                </Button>
                <Button variant="secondary" className="!h-11 !text-[15px] !w-auto px-6" onClick={() => setPending(null)} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-danger text-[13px] px-5 pb-3">{error}</p>}

          {rows.length > 0 && (
            <>
              <div className="px-5 pb-3 flex gap-2">
                {([['upcoming', `Upcoming (${rows.length - paidCount})`], ['paid', `Paid (${paidCount})`], ['all', 'All']] as const).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => setView(v)} className={clsx('h-9 px-3.5 rounded-full border text-[13px] font-medium', view === v ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}>
                    {label}
                  </button>
                ))}
              </div>

              <div className={clsx('hidden md:grid gap-3 px-5 py-2 border-y border-border/60 text-tertiary text-[12px] font-semibold uppercase tracking-wide', COLS)}>
                <span>Paid</span><span>No.</span><span>Due</span><span className="text-right">EMI</span><span className="text-right">Principal</span><span className="text-right">Interest</span><span className="text-right">Balance after</span>
              </div>

              <div className="max-h-[72dvh] overflow-y-auto divide-y divide-border/60">
                {shown.length === 0 && <p className="text-secondary text-[14px] text-center py-10">{view === 'paid' ? 'Nothing paid yet.' : 'All paid. 🎉'}</p>}
                {shown.map(({ r, balance }) => (
                  <div key={r.n} className={clsx('px-5 py-3 flex items-center gap-3 md:grid md:gap-3', COLS, r.paid && 'bg-positive/5')}>
                    <button
                      type="button"
                      onClick={() => tick(r.n, !r.paid)}
                      disabled={busyN === r.n}
                      aria-pressed={r.paid}
                      aria-label={`${r.paid ? 'Un-tick' : 'Tick'} instalment ${r.n}`}
                      className={clsx('w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors', r.paid ? 'bg-positive border-positive text-on-type' : 'border-border bg-card')}
                    >
                      {busyN === r.n ? <Loader2 size={15} className="animate-spin" /> : r.paid ? <Check size={17} strokeWidth={3} /> : null}
                    </button>
                    <span className="hidden md:block text-tertiary text-[13px] tabular-nums">{r.n}</span>
                    <span className="min-w-0 flex-1 md:flex-none">
                      <span className="block text-white text-[14px] font-medium">{r.date ? format(parseISO(r.date), 'd MMM yyyy') : `EMI ${r.n}`}</span>
                      <span className="block md:hidden text-tertiary text-[12px] tabular-nums">
                        #{r.n} · principal {formatCurrency(r.principal)} · interest {formatCurrency(r.interest)}
                      </span>
                    </span>
                    <span className="text-white text-[14px] font-semibold tabular-nums md:text-right shrink-0">{formatCurrency(r.emi)}</span>
                    <span className="hidden md:block text-secondary text-[14px] tabular-nums text-right">{formatCurrency(r.principal)}</span>
                    <span className="hidden md:block text-secondary text-[14px] tabular-nums text-right">{formatCurrency(r.interest)}</span>
                    <span className="hidden md:block text-white text-[14px] tabular-nums text-right">{formatCurrency(balance)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <AddLoanSheet open={editing} loan={loan} onClose={() => setEditing(false)} />
    </div>
  )
}
