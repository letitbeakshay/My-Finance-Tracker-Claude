import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { incomeRepo, loanRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import type { Income, Loan } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

export function IncomeSheet({ income, onClose }: { income: Income | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false)

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
          <p className="text-accent-ink text-[32px] font-bold tabular-nums mb-2">
            +{formatCurrency(income.amount)}
          </p>
          {income.notes && <p className="text-secondary text-[15px] mb-4">{income.notes}</p>}
          <div className="mt-6">
            <Button variant="secondary" onClick={handleDelete} disabled={busy} className="!text-danger">
              Delete income
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

export function LoanSheet({ loan, onClose }: { loan: Loan | null; onClose: () => void }) {
  const [payment, setPayment] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPayment(loan?.emi ? String(loan.emi) : '')
  }, [loan])

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
    <BottomSheet open={!!loan} onClose={onClose}>
      {loan && (
        <>
          <p className="text-secondary text-[14px] mb-1">
            {loan.kind === 'borrowed' ? 'You owe' : 'Owed to you'}
          </p>
          <h2 className="text-white text-[20px] font-bold mb-1">{loan.name}</h2>
          <p className="text-white text-[32px] font-bold tabular-nums mb-1">
            {formatCurrency(loan.principal - loan.paid)}
            <span className="text-tertiary text-[15px] font-medium"> left</span>
          </p>
          <p className="text-tertiary text-[13px] mb-5">
            {formatCurrency(loan.paid)} of {formatCurrency(loan.principal)} paid
          </p>

          {!loan.closed && (
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
          <Button variant="secondary" onClick={handleDelete} disabled={busy} className="!text-danger">
            Delete loan
          </Button>
        </>
      )}
    </BottomSheet>
  )
}
