import { useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Landmark, CreditCard, PiggyBank, HandHeart, Zap } from 'lucide-react'
import { Button } from '../ui/Button'
import { CurrencySelect } from '../ui/CurrencySelect'
import { getCurrency, setCurrency } from '../../lib/currency'
import { paymentAccountRepo, settingsRepo } from '../../db/repository'
import { useSettings } from '../../hooks/useLiveData'
import { VERSES } from '../../lib/scripture'
import { APP_NAME } from '../../lib/config'
import type { PaymentAccountType } from '../../types'

const FIELD = 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary focus:border-accent outline-none'

const GIVING = [0, 5, 10, 15, 20]
const SAVING = [0, 5, 10, 20, 30]

const TYPES: { value: PaymentAccountType; label: string; icon: string }[] = [
  { value: 'bank_account', label: 'Bank account', icon: '🏦' },
  { value: 'credit_card', label: 'Credit card', icon: '💳' },
  { value: 'debit_card', label: 'Debit card', icon: '💳' },
]

function Pct({ options, value, onChange, label }: { options: number[]; value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-5 gap-2">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={clsx(
            'h-12 rounded-2xl border text-[16px] font-semibold transition-colors',
            value === n ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white',
          )}
        >
          {n}%
        </button>
      ))}
    </div>
  )
}

/** The first thing a new person sees: a short welcome, their giving and saving shares, and an optional first account. */
export function Onboarding({ name, onDone }: { name?: string; onDone: () => void }) {
  const settings = useSettings()
  const [step, setStep] = useState(0)
  const startCurrency = useState(() => getCurrency().code)[0]
  const [currency, setCurrencyState] = useState(startCurrency)
  const [giving, setGiving] = useState(10)
  const [saving, setSaving] = useState(10)
  const [accountType, setAccountType] = useState<PaymentAccountType>('bank_account')
  const [label, setLabel] = useState('')
  const [added, setAdded] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function saveShares() {
    setBusy(true)
    setError('')
    try {
      await settingsRepo.updatePlan({ givingPercent: giving, savingPercent: saving, pauseThreshold: settings?.pauseThreshold ?? 2000 })
      if (currency !== startCurrency) {
        await settingsRepo.setCurrency(currency)
        setCurrency(currency)
      }
      setStep(2)
    } catch {
      setError('Could not save. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function addAccount() {
    if (!label.trim()) return
    setBusy(true)
    setError('')
    try {
      await paymentAccountRepo.add({
        label: label.trim(),
        type: accountType,
        icon: accountType === 'bank_account' ? '🏦' : '💳',
      })
      setAdded((a) => [...a, label.trim()])
      setLabel('')
    } catch {
      setError('Could not add it. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await settingsRepo.markOnboarded()
      // A different currency changes every amount shown, so start fresh in it.
      if (currency !== startCurrency) window.location.reload()
      else onDone()
    } catch {
      setError('Could not finish. Please check your connection and try again.')
      setBusy(false)
    }
  }

  const steps = 4

  return (
    <div className="fixed inset-0 bg-bg z-[90] overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px]">
          <div className="flex gap-1.5 mb-8" aria-label={`Step ${step + 1} of ${steps}`}>
            {Array.from({ length: steps }, (_, i) => (
              <span key={i} className={clsx('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-border')} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <>
                  <h1 className="text-white text-[28px] font-bold leading-tight">
                    Welcome{name ? `, ${name}` : ''}
                  </h1>
                  <p className="text-secondary text-[16px] mt-2 leading-relaxed">
                    {APP_NAME} helps you use what you have wisely and with thanks. Here is what you can do:
                  </p>
                  <div className="flex flex-col gap-3 mt-6">
                    {[
                      { icon: Zap, title: 'Log an expense in seconds', text: 'Amount, category, done. Say if it pleased God and see how it affects your budget.' },
                      { icon: HandHeart, title: 'Give first', text: 'Set aside a share of every income for giving before anything else.' },
                      { icon: PiggyBank, title: 'Plan, save and get free of debt', text: 'Monthly budgets, savings plans, and loans with a clear way to clear them.' },
                    ].map(({ icon: Icon, title, text }) => (
                      <div key={title} className="flex gap-3.5 bg-card border border-border rounded-2xl p-4">
                        <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-accent-ink shrink-0">
                          <Icon size={19} />
                        </span>
                        <span>
                          <span className="block text-white text-[15px] font-semibold">{title}</span>
                          <span className="block text-secondary text-[14px] leading-snug mt-0.5">{text}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7">
                    <Button onClick={() => setStep(1)}>Let’s set it up</Button>
                  </div>
                  <p className="text-tertiary text-[12px] italic text-center mt-6 leading-relaxed">
                    “{VERSES.provider.text}” — {VERSES.provider.ref}
                  </p>
                </>
              )}

              {step === 1 && (
                <>
                  <h1 className="text-white text-[26px] font-bold leading-tight">Currency, giving and saving</h1>
                  <p className="text-secondary text-[15px] mt-2 leading-relaxed">
                    When you record income, we work out how much to set aside. You can change these any time in Settings.
                  </p>
                  <p className="text-white text-[15px] font-semibold mt-6 mb-1">Your currency</p>
                  <p className="text-tertiary text-[13px] mb-2.5">Every amount is shown in it. You can change it in Settings.</p>
                  <CurrencySelect value={currency} onChange={setCurrencyState} />
                  <p className="text-white text-[15px] font-semibold mt-6 mb-1">Give (tithe, first fruits)</p>
                  <p className="text-tertiary text-[13px] mb-2.5">Share of each income to give before you spend.</p>
                  <Pct options={GIVING} value={giving} onChange={setGiving} label="Giving percent" />
                  <p className="text-white text-[15px] font-semibold mt-6 mb-1">Save</p>
                  <p className="text-tertiary text-[13px] mb-2.5">Share of each income to put into savings.</p>
                  <Pct options={SAVING} value={saving} onChange={setSaving} label="Saving percent" />
                  {error && <p className="text-danger text-[14px] mt-4">{error}</p>}
                  <div className="mt-8 flex gap-3">
                    <Button variant="secondary" className="!w-auto px-6" onClick={() => setStep(0)}>Back</Button>
                    <Button onClick={saveShares} disabled={busy}>Continue</Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="text-white text-[26px] font-bold leading-tight">Where is your money?</h1>
                  <p className="text-secondary text-[15px] mt-2 leading-relaxed">
                    Add a bank account or card so you can say which one you paid with. You can skip this and add them later.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setAccountType(t.value)}
                        aria-pressed={accountType === t.value}
                        className={clsx(
                          'h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-1 text-[13px] font-semibold transition-colors',
                          accountType === t.value ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white',
                        )}
                      >
                        {t.value === 'bank_account' ? <Landmark size={20} /> : <CreditCard size={20} />}
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addAccount()}
                      placeholder={accountType === 'bank_account' ? 'e.g. SBI Savings' : 'e.g. HDFC Credit Card'}
                      className={FIELD}
                    />
                    <Button className="!w-auto px-5 shrink-0" onClick={addAccount} disabled={busy || !label.trim()}>
                      Add
                    </Button>
                  </div>
                  {added.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {added.map((a, i) => (
                        <span key={`${a}-${i}`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-surface border border-border text-white text-[14px]">
                          <Check size={14} className="text-positive" /> {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {error && <p className="text-danger text-[14px] mt-4">{error}</p>}
                  <div className="mt-8 flex gap-3">
                    <Button variant="secondary" className="!w-auto px-6" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)}>{added.length ? 'Continue' : 'Skip for now'}</Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center text-accent-ink mb-5">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h1 className="text-white text-[28px] font-bold leading-tight">You are all set</h1>
                  <p className="text-secondary text-[16px] mt-2 leading-relaxed">
                    We have added a set of common categories for you. You can rename them, add your own or remove the ones you do not need in Settings.
                  </p>
                  <div className="bg-card border border-border rounded-2xl p-4 mt-6 text-[14px] text-secondary leading-relaxed">
                    <p className="text-white font-semibold mb-1">Your first step</p>
                    Tap <span className="text-white font-semibold">Expense</span>, type an amount, and pick a category. Record your income from the Dashboard to see how much to give first.
                  </div>
                  {error && <p className="text-danger text-[14px] mt-4">{error}</p>}
                  <div className="mt-8">
                    <Button onClick={finish} disabled={busy}>Start using {APP_NAME}</Button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
