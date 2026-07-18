import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { AmountInput } from './AmountInput'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { PaymentAccountPicker } from './PaymentAccountPicker'
import { SegmentedControl } from '../ui/SegmentedControl'
import { Button } from '../ui/Button'
import { SuccessAnimation } from './SuccessAnimation'
import { useCategories, usePaymentAccounts } from '../../hooks/useLiveData'
import { expenseRepo } from '../../db/repository'
import { PAYMENT_METHOD_ACCOUNT_TYPE } from '../../types'
import type { Expense, ExpenseType, PaymentMethod } from '../../types'

interface AddExpenseScreenProps {
  onDone: () => void
  onCancel: () => void
  editExpense?: Expense
}

const TYPE_OPTIONS: { value: ExpenseType; label: string; color: string }[] = [
  { value: 'need', label: 'Need', color: '#5b9dff' },
  { value: 'want', label: 'Want', color: '#ff9f43' },
  { value: 'savings', label: 'Savings', color: '#24d968' },
]

export function AddExpenseScreen({ onDone, onCancel, editExpense }: AddExpenseScreenProps) {
  const categories = useCategories()
  const accounts = usePaymentAccounts()
  const [amount, setAmount] = useState(editExpense ? String(editExpense.amount) : '')
  const [categoryId, setCategoryId] = useState<string | null>(editExpense?.categoryId ?? null)
  const [type, setType] = useState<ExpenseType>(editExpense?.type ?? 'need')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editExpense?.paymentMethod ?? 'upi',
  )
  const [accountId, setAccountId] = useState<string | null>(editExpense?.accountId ?? null)
  const [notes, setNotes] = useState(editExpense?.notes ?? '')
  const [date, setDate] = useState(editExpense?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

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
    if (editExpense) {
      await expenseRepo.update(editExpense.id, {
        amount: numericAmount,
        categoryId: effectiveCategoryId,
        type,
        paymentMethod,
        accountId: accountId ?? undefined,
        notes: notes.trim() || undefined,
        date,
      })
      onDone()
      return
    }
    await expenseRepo.add({
      amount: numericAmount,
      categoryId: effectiveCategoryId,
      type,
      paymentMethod,
      accountId: accountId ?? undefined,
      notes: notes.trim() || undefined,
      date,
    })
    setShowSuccess(true)
    setTimeout(() => {
      onDone()
    }, 900)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-[19px] font-bold">{editExpense ? 'Edit Expense' : 'Add Expense'}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
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
            className="w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[15px] placeholder:text-tertiary"
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
            className="w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[15px]"
          />
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button onClick={handleSave} disabled={!canSave}>
          {editExpense ? 'Save Changes' : 'Save Expense'}
        </Button>
      </div>

      <AnimatePresence>{showSuccess && <SuccessAnimation amount={numericAmount} />}</AnimatePresence>
    </div>
  )
}
