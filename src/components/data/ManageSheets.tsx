import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { incomeRepo, loanRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import { loanStats } from '../../lib/loanMath'
import { AddLoanSheet } from './AddLoanSheet'
import type { Income, Loan } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

export function IncomeSheet({ income, onClose }: { income: Income | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setConfirming(false)
  }, [income])

  async function handleDelete() {
    if (!income) return
    setBusy(true)
    try {
      await incomeRepo.remove(income.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={!!income} onClose={onClose}>
      {income && (
        <>
          <p className="text-secondary text-[14px] mb-1">{format(parseISO(income.date), 'd MMMM yyyy')}</p>
          <h2 className="text-white text-[20px] font-bold mb-1">{income.source}</h2>
          <p className="text-positive text-[32px] font-bold tabular-nums mb-2">
            +{formatCurrency(income.amount)}
          </p>
          {income.notes && <p className="text-secondary text-[15px] mb-4">{income.notes}</p>}
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={confirming ? handleDelete : () => setConfirming(true)}
              disabled={busy}
              className="!text-danger"
            >
              {confirming ? 'Tap again to delete this income' : 'Delete income'}
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-card border border-border px-3 py-2.5">
      <p className="text-tertiary text-[11px] font-medium">{label}</p>
      <p className={strong ? 'text-white text-[16px] font-bold tabular-nums mt-0.5' : 'text-white text-[15px] font-semibold tabular-nums mt-0.5'}>{value}</p>
    </div>
  )
}

export function LoanSheet({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const [payment, setPayment] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setPayment(loan?.emi ? String(loan.emi) : '')
    setConfirming(false)
  }, [loan])

  const stats = loan ? loanStats(loan) : null

  async function handlePayment() {
    const amount = parseFloat(payment) || 0
    if (!loan || amount <= 0) return
    setBusy(true)
    try {
      await loanRepo.recordPayment(loan, amount)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  async function handleEmi() {
    if (!loan) return
    setBusy(true)
    try {
      await loanRepo.recordEmi(loan)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!loan) return
    setBusy(true)
    try {
      await loanRepo.remove(loan.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <BottomSheet open={!!loan && !editing} onClose={onClose}>
        {loan && stats && (
          <>
            <p className="text-secondary text-[14px] mb-1">{loan.kind === 'borrowed' ? 'You owe' : 'Owed to you'}</p>
            <h2 className="text-white text-[20px] font-bold mb-1">{loan.name}</h2>
            <p className="text-white text-[32px] font-bold tabular-nums mb-1">
              {formatCurrency(stats.outstanding)}
              <span className="text-tertiary text-[15px] font-medium"> pending</span>
            </p>
            <p className="text-tertiary text-[13px] mb-4">
              {formatCurrency(stats.principalPaid)} of {formatCurrency(loan.principal)} paid back
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {stats.hasPlan && (
                <>
                  <Fact label="EMIs paid" value={stats.totalEmis ? `${stats.emisPaid} of ${stats.totalEmis}` : String(stats.emisPaid)} />
                  <Fact label="EMIs left" value={stats.remainingEmis != null ? String(stats.remainingEmis) : 'not clearing'} />
                  <Fact label="Monthly EMI" value={formatCurrency(Math.round(stats.emi))} />
                  <Fact label="Interest rate" value={loan.interestRate ? `${loan.interestRate}% a year` : 'none'} />
                  <Fact label="Paid so far (all EMIs)" value={formatCurrency(stats.totalPaid)} />
                  <Fact label="Interest paid so far" value={formatCurrency(stats.interestPaid)} />
                  {stats.remainingPayable != null && <Fact label="Still to pay (with interest)" value={formatCurrency(stats.remainingPayable)} />}
                  {stats.remainingInterest != null && <Fact label="Interest still to come" value={formatCurrency(stats.remainingInterest)} />}
                  {stats.totalInterest != null && <Fact label="Total interest on the loan" value={formatCurrency(stats.totalInterest)} />}
                  {stats.payoffDate && <Fact label="Loan clears" value={format(parseISO(stats.payoffDate), 'MMM yyyy')} />}
                </>
              )}
              {loan.nextDueDate && !loan.closed && <Fact label="Next EMI due" value={format(parseISO(loan.nextDueDate), 'd MMM yyyy')} />}
            </div>
            {!stats.hasPlan && (
              <p className="text-tertiary text-[13px] mb-4">Add the interest rate and EMI (Edit details) to see EMIs left, interest and when it clears.</p>
            )}

            {!loan.closed && stats.hasPlan && (
              <Button onClick={handleEmi} disabled={busy} className="mb-3">
                I paid this month’s EMI
              </Button>
            )}
            {!loan.closed && !stats.hasPlan && (
              <div className="flex gap-3 mb-3">
                <input
                  value={payment}
                  onChange={(e) => setPayment(e.target.value.replace(/[^0-9.]/g, ''))}
                  inputMode="decimal"
                  placeholder="Payment amount"
                  className={FIELD}
                />
                <Button onClick={handlePayment} disabled={busy || !(parseFloat(payment) > 0)} className="!w-auto px-6 shrink-0">
                  Record
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setEditing(true)} disabled={busy}>
                Edit details
              </Button>
              <Button variant="secondary" onClick={confirming ? handleDelete : () => setConfirming(true)} disabled={busy} className="!text-danger">
                {confirming ? 'Tap again to delete' : 'Delete loan'}
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
      <AddLoanSheet
        open={editing}
        loan={loan}
        onClose={() => {
          setEditing(false)
          onClose()
        }}
      />
    </>
  )
}
