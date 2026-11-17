import { useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { HandHeart, PiggyBank, Plus, Settings2, Target, Zap, type LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'

interface Slide {
  icon: LucideIcon
  title: string
  text: string
  tip: string
}

const SLIDES: Slide[] = [
  { icon: Plus, title: 'Add in seconds', text: 'Tap Expense, type the amount, pick a category. The amount screen opens ready to type.', tip: 'Tip: switch to Income at the top to record money you receive.' },
  { icon: Zap, title: 'Quick add and smart guesses', text: 'The things you add often show up as one-tap buttons. Type a note like “Coffee” and we fill in the rest from your history.', tip: 'Tip: made a mistake? Tap Undo right after saving.' },
  { icon: HandHeart, title: 'Did it please God?', text: 'Every expense asks one question. Over time you see where your money honours God and where it can do better.', tip: 'Tip: record income, and we show how much to give first.' },
  { icon: Target, title: 'Plan your month', text: 'Set a monthly plan, with items that repeat and ones for one month only. Each category shows what is left as you add.', tip: 'Tip: open Dashboard, then Budgets.' },
  { icon: PiggyBank, title: 'Savings and loans', text: 'Give every saving a plan, and see a clear way out of debt with your repayment schedule.', tip: 'Tip: import a bank statement PDF from Transactions.' },
  { icon: Settings2, title: 'Make it yours', text: 'Change the currency, theme, categories and accounts in Settings. You can take this tour again from there any time.', tip: 'Your data is private to you.' },
]

/** A short first-time guide. */
export function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  const Icon = s.icon
  return (
    <div className="fixed inset-0 z-[95] bg-black/50 flex items-end md:items-center justify-center md:p-6" role="dialog" aria-label="Quick tour">
      <div className="bg-bg w-full md:max-w-[440px] rounded-t-sheet md:rounded-3xl border border-border p-6 pb-8">
        <div className="flex gap-1.5 mb-6" aria-hidden>
          {SLIDES.map((_, k) => (
            <span key={k} className={clsx('h-1.5 flex-1 rounded-full', k <= i ? 'bg-primary' : 'bg-border')} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>
            <span className="w-14 h-14 rounded-2xl bg-accent-soft text-accent-ink flex items-center justify-center mb-4">
              <Icon size={26} />
            </span>
            <h2 className="text-white text-[22px] font-bold leading-tight">{s.title}</h2>
            <p className="text-secondary text-[15px] leading-relaxed mt-2">{s.text}</p>
            <p className="text-accent-ink text-[13px] font-medium mt-3">{s.tip}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-3 mt-7">
          {!last && (
            <Button variant="secondary" className="!w-auto px-6" onClick={onClose}>
              Skip
            </Button>
          )}
          <Button onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Got it' : 'Next'}</Button>
        </div>
      </div>
    </div>
  )
}
