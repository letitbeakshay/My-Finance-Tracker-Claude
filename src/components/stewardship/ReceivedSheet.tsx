import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { expenseRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import { lastAccountFor, rememberAccount } from '../../lib/lastAccount'
import type { Expense, PaymentAccount } from '../../types'

const FIELD = 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

/** Confirms money has come back for a reimbursable expense: how much, when and into which bank account. */
export function ReceivedSheet({ expense, bankAccounts, onClose }: { expense: Expense | null; bankAccounts: PaymentAccount[]; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [accountId, setAccountId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!expense) return
    setAmount(String(expense.amount))
    setDate(format(new Date(), 'yyyy-MM-dd'))
    const last = lastAccountFor('reimbursement')
    setAccountId(last && bankAccounts.some((a) => a.id === last) ? last : (bankAccounts[0]?.id ?? ''))
    setError('')
  }, [expense, bankAccounts])

  const n = parseFloat(amount) || 0

  async function save() {
    if (!expense || n <= 0) return
    setBusy(true)
    setError('')
    try {
      await expenseRepo.settleReimbursements([expense], { amount: n, date, accountId: accountId || undefined })
      rememberAccount('reimbursement', accountId)
      onClose()
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={!!expense} onClose={onClose}>
      {expense && (
        <>
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">Money received</p>
          <h2 className="text-white text-[20px] font-bold mt-0.5">{expense.notes || 'Reimbursement'}</h2>
          <p className="text-secondary text-[14px] mt-1 mb-4">You paid {formatCurrency(expense.amount)}.</p>
          <div className="flex flex-col gap-3 mb-4">
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="Amount received" className={FIELD} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
            {bankAccounts.length > 0 && (
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={FIELD}>
                <option value="">Which bank account? (optional)</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-tertiary text-[12px] mb-4 leading-relaxed">
            This marks the expense as paid back and adds the money to the account. It is not counted as income, so your first fruits and savings targets stay right.
          </p>
          {error && <p className="text-danger text-[13px] mb-3">{error}</p>}
          <Button onClick={save} disabled={busy || n <= 0}>
            Mark as received
          </Button>
        </>
      )}
    </BottomSheet>
  )
}
