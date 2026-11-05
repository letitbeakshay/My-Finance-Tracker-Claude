import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Receipt } from 'lucide-react'
import { Card } from '../ui/Card'
import { expenseRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import { categoryPath } from '../../lib/categoryTree'
import { pendingReimbursements, reimbursableIds } from '../../lib/reimbursement'
import type { Category, Expense } from '../../types'

interface ReimbursementCardProps {
  expenses: Expense[]
  categories: Category[]
  /** How many pending items to list; omit for all of them. */
  limit?: number
}

/** Expenses you paid for someone else and are waiting to get back. Hidden when there are none. */
export function ReimbursementCard({ expenses, categories, limit }: ReimbursementCardProps) {
  const [error, setError] = useState('')
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const ids = useMemo(() => reimbursableIds(categories), [categories])
  const pending = useMemo(
    () => pendingReimbursements(expenses, ids).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, ids],
  )
  if (ids.size === 0) return null

  const total = pending.reduce((s, e) => s + e.amount, 0)
  const shown = limit ? pending.slice(0, limit) : pending

  async function markReceived(id: string) {
    setError('')
    try {
      await expenseRepo.setReimbursed(id, true)
    } catch {
      setError('Could not save. Make sure the latest supabase/migration-categories-v2.sql has been run.')
    }
  }

  return (
    <Card>
      <h2 className="text-white text-[17px] font-bold flex items-center gap-2">
        <Receipt size={18} className="text-accent-ink" /> Awaiting reimbursement
      </h2>
      <p className="text-tertiary text-[12px] mb-4">Not counted in your own spending</p>

      {pending.length === 0 ? (
        <p className="text-positive text-[14px] font-medium">Nothing pending. All paid back.</p>
      ) : (
        <>
          <p className="text-white text-[28px] font-bold tabular-nums leading-none mb-4">
            {formatCurrency(total)}
            <span className="text-tertiary text-[14px] font-medium">
              {' '}
              · {pending.length} {pending.length === 1 ? 'expense' : 'expenses'}
            </span>
          </p>
          <div className="flex flex-col gap-3">
            {shown.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-white text-[14px] font-medium truncate">
                    {e.notes || categoryPath(byId.get(e.categoryId), byId)}
                  </span>
                  <span className="block text-tertiary text-[12px]">{format(parseISO(e.date), 'd MMM')}</span>
                </span>
                <span className="text-white font-semibold text-[14px] tabular-nums shrink-0">{formatCurrency(e.amount)}</span>
                <button
                  type="button"
                  onClick={() => markReceived(e.id)}
                  className="h-9 px-3 rounded-full bg-accent-soft text-accent-ink text-[13px] font-semibold shrink-0"
                >
                  Received
                </button>
              </div>
            ))}
          </div>
          {limit && pending.length > limit && (
            <p className="text-tertiary text-[12px] mt-3">+{pending.length - limit} more on the Dashboard</p>
          )}
        </>
      )}
      {error && <p className="text-danger text-[13px] mt-3">{error}</p>}
    </Card>
  )
}
