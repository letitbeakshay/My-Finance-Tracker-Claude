import { useState, type ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { AddExpenseScreen } from '../add/AddExpenseScreen'
import { expenseRepo } from '../../db/repository'
import type { Category, Expense } from '../../types'
import { EXPENSE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import { formatCurrency } from '../../lib/currency'

interface TransactionSheetProps {
  expense: Expense | null
  category?: Category
  onClose: () => void
}

const TYPE_COLOR: Record<string, string> = {
  need: '#5b9dff',
  want: '#ff9f43',
  savings: '#5fb888',
}

export function TransactionSheet({ expense, category, onClose }: TransactionSheetProps) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!expense) return null

  async function handleDelete() {
    await expenseRepo.remove(expense!.id)
    setConfirmingDelete(false)
    onClose()
  }

  if (editing) {
    return (
      <div className="fixed inset-0 max-w-[560px] mx-auto z-[70] bg-bg">
        <AddExpenseScreen
          editExpense={expense}
          onDone={() => {
            setEditing(false)
            onClose()
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <BottomSheet open={!!expense} onClose={onClose}>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-2xl">
          {category?.icon ?? '📦'}
        </div>
        <div>
          <p className="text-white text-[24px] font-bold leading-none tabular-nums">
            {formatCurrency(expense.amount)}
          </p>
          <p className="text-secondary text-[14px]">{category?.name ?? 'Others'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-7">
        <Row
          label="Type"
          value={
            <span
              className="px-2.5 py-1 rounded-full text-[13px] font-semibold"
              style={{
                background: `${TYPE_COLOR[expense.type]}22`,
                color: TYPE_COLOR[expense.type],
              }}
            >
              {EXPENSE_TYPE_LABELS[expense.type]}
            </span>
          }
        />
        <Row label="Payment Method" value={PAYMENT_METHOD_LABELS[expense.paymentMethod]} />
        <Row label="Date" value={format(parseISO(expense.date), 'd MMMM yyyy')} />
        <Row label="Notes" value={expense.notes || '—'} />
      </div>

      {confirmingDelete ? (
        <div className="flex flex-col gap-3">
          <p className="text-secondary text-[14px] text-center">Delete this expense?</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-danger! text-white!"
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingDelete(true)} className="text-danger!">
            Delete
          </Button>
        </div>
      )}
    </BottomSheet>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-secondary text-[14px]">{label}</span>
      <span className="text-white text-[14px] font-medium max-w-[60%] text-right truncate">
        {value}
      </span>
    </div>
  )
}
