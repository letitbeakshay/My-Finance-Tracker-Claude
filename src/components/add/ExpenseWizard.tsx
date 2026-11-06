import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { Check, HandHeart, Home, PiggyBank, Receipt, Sparkles, X, type LucideIcon } from 'lucide-react'
import { AmountInput } from './AmountInput'
import { CategoryPicker } from './CategoryPicker'
import { PaymentMethodPicker } from './PaymentMethodPicker'
import { PaymentAccountPicker } from './PaymentAccountPicker'
import { SavingsPlanPicker } from '../savings/SavingsPlanPicker'
import { lastAccountFor, rememberAccount } from '../../lib/lastAccount'
import { SuccessAnimation } from './SuccessAnimation'
import { CountTheCostSheet } from './CountTheCostSheet'
import { PleasesGodPicker } from './PleasesGodPicker'
import type { AddExpensePreset } from './AddExpenseScreen'
import { Button } from '../ui/Button'
import {
  useEffectiveBudgets,
  useCategories,
  useExpenses,
  usePaymentAccounts,
  useSavingsPlans,
  useSettings,
} from '../../hooks/useLiveData'
import { expenseRepo } from '../../db/repository'
import { budgetProgress } from '../../lib/budgets'
import { categoryPath, parentMap, suggestedType } from '../../lib/categoryTree'
import { reimbursableIds } from '../../lib/reimbursement'
import { formatCurrency } from '../../lib/currency'
import {
  EXPENSE_TYPE_COLORS,
  EXPENSE_TYPE_LABELS,
  PAYMENT_METHOD_ACCOUNT_TYPE,
  PAYMENT_METHOD_LABELS,
  type ExpenseType,
  type PaymentMethod,
} from '../../types'

const STEPS = ['Amount', 'Category', 'Type', 'Payment'] as const

const TYPE_CARDS: { value: ExpenseType; icon: LucideIcon; blurb: string }[] = [
  { value: 'need', icon: Home, blurb: 'Essentials like rent, food, bills and fuel' },
  { value: 'want', icon: Sparkles, blurb: 'Nice to have, but not essential' },
  { value: 'savings', icon: PiggyBank, blurb: 'Money set aside for the future' },
  { value: 'giving', icon: HandHeart, blurb: 'Tithe, offerings and helping others' },
]

const LABEL = 'text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide'

interface ExpenseWizardProps {
  onDone: () => void
  onCancel: () => void
  preset?: AddExpensePreset
}

/** Adds an expense one question at a time: amount, category, type, then payment. */
export function ExpenseWizard({ onDone, onCancel, preset }: ExpenseWizardProps) {
  const categories = useCategories()
  const accounts = usePaymentAccounts()
  const savingsPlans = useSavingsPlans()
  const settings = useSettings()
  const budgets = useEffectiveBudgets()
  const expenses = useExpenses()

  const amountRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [amount, setAmount] = useState(preset?.amount ?? '')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState<string | null>(preset?.categoryId ?? null)
  const [type, setType] = useState<ExpenseType | null>(preset?.type ?? null)
  // Once you choose a type yourself, picking another category no longer changes it.
  const [typeTouched, setTypeTouched] = useState(!!preset?.type)
  // Giving to God obviously pleases Him; everything else you answer yourself.
  const [pleasesGod, setPleasesGod] = useState<boolean | null>(preset?.type === 'giving' ? true : null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [savingsPlanId, setSavingsPlanId] = useState<string | null>(() => lastAccountFor('savings_plan'))
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pausing, setPausing] = useState(false)

  const numericAmount = parseFloat(amount) || 0
  const accountType = PAYMENT_METHOD_ACCOUNT_TYPE[paymentMethod]
  const category = categories?.find((c) => c.id === categoryId)
  const categoryById = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const reimbursable = useMemo(() => reimbursableIds(categories ?? []), [categories])
  const suggested = suggestedType(category, categoryById)

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    // A different payment method means any picked card/account may no longer apply; start from the one used last time.
    const last = lastAccountFor(paymentMethod)
    setAccountId(last && accounts?.some((a) => a.id === last) ? last : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod])

  // Once the accounts have loaded, start with the one used last for this payment method.
  useEffect(() => {
    const last = lastAccountFor(paymentMethod)
    if (last && accounts?.some((a) => a.id === last)) setAccountId((cur) => cur ?? last)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts])

  // Budget progress for the month of the expense being added.
  const budgetLines = useMemo(() => {
    if (!budgets || !expenses) return new Map()
    const progress = budgetProgress(budgets, expenses, parseISO(date), {
      parents: parentMap(categories ?? []),
      reimbursable,
    })
    return new Map(progress.categories.map((l) => [l.categoryId!, l]))
  }, [budgets, expenses, date, categories, reimbursable])

  const valid = [numericAmount > 0 && !!date, !!categoryId && pleasesGod !== null, !!type, true][step]

  function go(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  // Until the saved plan has loaded, use the default so a fast save can't skip the pause.
  const pauseThreshold = settings?.pauseThreshold ?? 2000

  async function handleSave(skipPause = false) {
    if (saving || !categoryId || !type || numericAmount <= 0) return
    if (!skipPause && type === 'want' && pauseThreshold > 0 && numericAmount >= pauseThreshold) {
      setPausing(true)
      return
    }
    setPausing(false)
    setSaving(true)
    await expenseRepo.add({
      amount: numericAmount,
      categoryId,
      type,
      paymentMethod,
      accountId: accountId ?? undefined,
      notes: notes.trim() || undefined,
      date,
      pleasesGod: pleasesGod ?? undefined,
      savingsPlanId: type === 'savings' && savingsPlans?.some((p) => p.id === savingsPlanId) ? savingsPlanId ?? undefined : undefined,
    })
    rememberAccount(paymentMethod, accountId)
    if (type === 'savings') rememberAccount('savings_plan', savingsPlanId)
    setShowSuccess(true)
    setTimeout(onDone, 900)
  }

  const isLast = step === STEPS.length - 1

  return (
    <div
      className="flex flex-col h-full touch-pan-y"
      onClick={(e) => {
        // iPhone only opens the keyboard from a real tap, so any tap on empty space starts typing.
        if (step === 0 && !(e.target as HTMLElement).closest('input, button, label, a')) {
          amountRef.current?.focus()
        }
      }}
    >
      <div className="px-6 pt-3 pb-2">
        <div className="flex items-center justify-between">
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
          <div className="text-center">
            <h1 className="text-[19px] font-bold leading-tight">{STEPS[step]}</h1>
            <p className="text-tertiary text-[12px]">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
          <div className="w-10" />
        </div>
        <div className="flex gap-1.5 mt-3" aria-hidden>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={clsx('h-1 flex-1 rounded-full transition-colors duration-300', i <= step ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 28 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -28 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {step === 0 && (
              <>
                <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />
                <div className="mb-5">
                  <p className={LABEL}>Note</p>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && valid && go(1)}
                    placeholder="What was it for? (optional)"
                    enterKeyHint="next"
                    className="w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary"
                  />
                </div>
                <div>
                  <p className={LABEL}>Date</p>
                  <input
                    type="date"
                    value={date}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full min-w-0 max-w-full h-14 bg-surface border border-border rounded-2xl px-4 text-white text-[16px] text-left appearance-none"
                  />
                </div>
              </>
            )}

            {step === 1 && categories && (
              <>
                <div className="mb-6">
                  <PleasesGodPicker value={pleasesGod} onChange={setPleasesGod} />
                </div>
                <p className="text-secondary text-[14px] mb-4">
                  Where did {formatCurrency(numericAmount)} go? Tap one to open what is below it.
                </p>
                <CategoryPicker
                  variant="cards"
                  categories={categories}
                  value={categoryId}
                  budgetLines={budgetLines}
                  amount={numericAmount}
                  onChange={(id) => {
                    setCategoryId(id)
                    // Suggest the usual type for this category, unless you already chose one.
                    const sug = suggestedType(categoryById.get(id), categoryById)
                    if (sug && !typeTouched) setType(sug)
                  }}
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-secondary text-[14px] mb-4">
                  Was this a need, a want, savings or giving?{suggested ? ' We suggested the usual one for this category.' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {TYPE_CARDS.map(({ value, icon: Icon, blurb }) => {
                    const selected = type === value
                    const color = EXPENSE_TYPE_COLORS[value]
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setType(value)
                          setTypeTouched(true)
                          go(3)
                        }}
                        className={clsx(
                          'rounded-3xl border p-4 text-left min-h-[150px] flex flex-col transition-colors',
                          selected ? 'bg-accent-soft border-accent' : 'bg-card border-border',
                        )}
                      >
                        <span
                          className="w-11 h-11 rounded-full flex items-center justify-center"
                          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
                        >
                          <Icon size={22} />
                        </span>
                        <span className="text-white font-bold text-[18px] mt-3 flex items-center gap-2">
                          {EXPENSE_TYPE_LABELS[value]}
                          {suggested === value && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-ink bg-accent-soft rounded-full px-2 py-0.5">
                              Suggested
                            </span>
                          )}
                        </span>
                        <span className="text-tertiary text-[13px] leading-snug mt-1">{blurb}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="bg-card border border-border rounded-2xl p-4 mb-6 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-[20px] shrink-0">
                    {category?.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[15px] truncate">
                      {categoryPath(category, categoryById)} · {type ? EXPENSE_TYPE_LABELS[type] : ''}
                    </p>
                    <p className="text-tertiary text-[12px] truncate">
                      {format(parseISO(date), 'd MMM yyyy')}
                      {notes.trim() ? ` · ${notes.trim()}` : ''}
                    </p>
                  </div>
                  <p className="text-white font-bold text-[20px] tabular-nums shrink-0">{formatCurrency(numericAmount)}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold',
                      pleasesGod ? 'text-positive' : 'text-danger',
                    )}
                    style={{ background: `color-mix(in srgb, var(${pleasesGod ? '--color-positive' : '--color-danger'}) 12%, transparent)` }}
                  >
                    {pleasesGod ? <Check size={14} strokeWidth={2.6} /> : <X size={14} strokeWidth={2.6} />}
                    {pleasesGod ? 'Pleases God' : 'Does not please God'}
                  </span>
                  {categoryId && reimbursable.has(categoryId) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold bg-accent-soft text-accent-ink">
                      <Receipt size={14} /> Tracked for reimbursement
                    </span>
                  )}
                </div>

                {type === 'savings' && (
                  <div className="mb-6">
                    <p className={LABEL}>Which savings plan?</p>
                    <SavingsPlanPicker value={savingsPlanId} onChange={setSavingsPlanId} />
                  </div>
                )}

                <p className={LABEL}>How did you pay?</p>
                <div className="mb-6">
                  <PaymentMethodPicker big value={paymentMethod} onChange={setPaymentMethod} />
                </div>

                {accountType && accounts && (
                  <div className="mb-4">
                    <p className={LABEL}>
                      {accountType === 'credit_card' ? 'Which credit card?' : accountType === 'debit_card' ? 'Which debit card or account?' : paymentMethod === 'upi' ? 'Which bank is this UPI from?' : 'Which bank account?'}
                    </p>
                    <PaymentAccountPicker
                      accounts={accounts}
                      big
                      accountType={accountType}
                      value={accountId}
                      onChange={setAccountId}
                    />
                  </div>
                )}
                <p className="sr-only">{PAYMENT_METHOD_LABELS[paymentMethod]}</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8 pt-2 flex gap-3">
        {step > 0 && (
          <Button variant="secondary" onClick={() => go(step - 1)} className="!w-auto px-6 shrink-0">
            Back
          </Button>
        )}
        {isLast ? (
          <Button onClick={() => handleSave()} disabled={saving || !valid}>
            Save Expense
          </Button>
        ) : (
          <Button onClick={() => go(step + 1)} disabled={!valid}>
            Next
          </Button>
        )}
      </div>

      {pausing && (
        <CountTheCostSheet
          amount={numericAmount}
          onProceed={() => handleSave(true)}
          onCancel={() => setPausing(false)}
        />
      )}

      <AnimatePresence>{showSuccess && <SuccessAnimation amount={numericAmount} />}</AnimatePresence>
    </div>
  )
}
