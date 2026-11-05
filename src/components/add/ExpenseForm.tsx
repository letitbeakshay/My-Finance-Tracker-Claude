import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { AmountInput } from './AmountInput'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { PaymentAccountPicker } from './PaymentAccountPicker'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Button } from '../ui/Button'
import { PleasesGodPicker } from './PleasesGodPicker'
import { useCategories, usePaymentAccounts } from '../../hooks/useLiveData'
import { expenseRepo } from '../../db/repository'
import { PAYMENT_METHOD_ACCOUNT_TYPE } from '../../types'
import { EXPENSE_TYPE_COLORS } from '../../types'
import type { Expense, ExpenseType, PaymentMethod } from '../../types'

interface ExpenseFormProps {
  onDone: () => void
  onCancel: () => void
  editExpense: Expense
}

const TYPE_OPTIONS: { value: ExpenseType; label: string; color: string }[] = [
  { value: 'need', label: 'Need', color: EXPENSE_TYPE_COLORS.need },
  { value: 'want', label: 'Want', color: EXPENSE_TYPE_COLORS.want },
  { value: 'savings', label: 'Savings', color: EXPENSE_TYPE_COLORS.savings },
  { value: 'giving', label: 'Giving', color: EXPENSE_TYPE_COLORS.giving },
]

/** Editing an existing expense: every field on one screen. Adding uses ExpenseWizard. */
export function ExpenseForm({ onDone, onCancel, editExpense }: ExpenseFormProps) {
  const categories = useCategories()
  const accounts = usePaymentAccounts()
  const [amount, setAmount] = useState(String(editExpense.amount))
  const [categoryId, setCategoryId] = useState<string | null>(editExpense.categoryId)
  const [type, setType] = useState<ExpenseType>(editExpense.type)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editExpense.paymentMethod,
  )
  const [accountId, setAccountId] = useState<string | null>(editExpense.accountId ?? null)
  const [notes, setNotes] = useState(editExpense.notes ?? '')
  const [pleasesGod, setPleasesGod] = useState<boolean | null>(editExpense.pleasesGod ?? null)
  const [date, setDate] = useState(editExpense.date)
  const [saving, setSaving] = useState(false)

  const defaultCategoryId = useMemo(() => categories?.[0]?.id ?? null, [categories])
  const effectiveCategoryId = categoryId ?? defaultCategoryId

  const accountType = PAYMENT_METHOD_ACCOUNT_TYPE[paymentMethod]

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // Payment method changed after mount — any previously picked account no
    // longer necessarily matches (e.g. switching credit card -> bank account).
    setAccountId(null)
  }, [paymentMethod])

  const numericAmount = parseFloat(amount) || 0
  const canSave = numericAmount > 0 && !!effectiveCategoryId && !saving

  async function handleSave() {
    if (!canSave || !effectiveCategoryId) return
    setSaving(true)
    await expenseRepo.update(editExpense.id, {
      amount: numericAmount,
      categoryId: effectiveCategoryId,
      type,
      paymentMethod,
      accountId: accountId ?? undefined,
      notes: notes.trim() || undefined,
      date,
      ...(pleasesGod !== null ? { pleasesGod } : {}),
    })
    onDone()
  }

  return (
    <div className="flex flex-col h-full touch-pan-y">
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-[19px] font-bold">Edit Expense</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
        <AmountInput value={amount} onChange={setAmount} />

        <div className="mb-7">
          {categories && (
            <CategoryPicker
              categories={categories}
              value={effectiveCategoryId}
              onChange={setCategoryId}
            />
          )}
        </div>

        <div className="mb-7">
          <PleasesGodPicker value={pleasesGod} onChange={setPleasesGod} compact />
        </div>

        <div className="mb-7">
          <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
            Type
          </p>
          <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />
        </div>

        <div className="mb-7">
          <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
            Payment Method
          </p>
          <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
        </div>

        {accountType && accounts && (
          <div className="mb-7">
            <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
              {accountType === 'credit_card' ? 'Which Credit Card?' : 'Which Bank Account?'}
            </p>
            <PaymentAccountPicker
              accounts={accounts}
              accountType={accountType}
              value={accountId}
              onChange={setAccountId}
            />
          </div>
        )}

        <div className="mb-7">
          <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
            Notes
          </p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note (optional)"
            className="w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary"
          />
        </div>

        <div className="mb-4">
          <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
            Date
          </p>
          <input
            type="date"
            value={date}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full min-w-0 max-w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[16px] text-left appearance-none"
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button onClick={handleSave} disabled={!canSave}>
          Save Changes
        </Button>
      </div>

    </div>
  )
}
