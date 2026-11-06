import { motion } from 'framer-motion'
import { Check, Hourglass } from 'lucide-react'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/currency'
import { VERSES } from '../../lib/scripture'

/** What to say after an expense is saved, based on whether it pleased God and where it went. */
export interface Reflection {
  pleasesGod: boolean
  type: 'need' | 'want' | 'savings' | 'giving'
  /** For savings: the plan it went into, with its progress after this deposit. */
  plan?: { name: string; saved: number; target?: number }
  /** For spending that did not please God: a savings plan the money could have gone to. */
  couldHaveSaved?: { name: string; pctAfter?: number }
}

interface SuccessAnimationProps {
  amount: number
  reflection?: Reflection
  onContinue?: () => void
}

function Message({ amount, r }: { amount: number; r: Reflection }) {
  if (r.pleasesGod) {
    if (r.type === 'savings' && r.plan) {
      const pct = r.plan.target ? Math.min(100, Math.round((r.plan.saved / r.plan.target) * 100)) : null
      return (
        <>
          <p className="text-white text-[22px] font-bold">Well done. {formatCurrency(amount)} set aside.</p>
          <p className="text-secondary text-[15px] mt-2 leading-relaxed">
            {r.plan.name} now holds {formatCurrency(r.plan.saved)}
            {r.plan.target ? ` of ${formatCurrency(r.plan.target)}${pct !== null ? ` (${pct}%)` : ''}` : ''}. Wisdom stores up for tomorrow.
          </p>
          <p className="text-tertiary text-[13px] italic mt-4 leading-relaxed">“{VERSES.wiseSaves.text}” — {VERSES.wiseSaves.ref}</p>
        </>
      )
    }
    return (
      <>
        <p className="text-white text-[22px] font-bold">This pleases God</p>
        <p className="text-secondary text-[15px] mt-2 leading-relaxed">Thank you, Lord, for providing. {formatCurrency(amount)} spent with a clear conscience.</p>
        <p className="text-tertiary text-[13px] italic mt-4 leading-relaxed">“{VERSES.glory.text}” — {VERSES.glory.ref}</p>
      </>
    )
  }
  return (
    <>
      <p className="text-white text-[22px] font-bold">That was an unnecessary spend</p>
      <p className="text-secondary text-[15px] mt-2 leading-relaxed">
        {formatCurrency(amount)} went on something that does not please God.
        {r.couldHaveSaved
          ? ` That money could have gone into ${r.couldHaveSaved.name}${r.couldHaveSaved.pctAfter ? ` and moved it to ${r.couldHaveSaved.pctAfter}%` : ''}.`
          : ' That is money you could have saved or given.'}
      </p>
      <p className="text-secondary text-[15px] mt-2 leading-relaxed">Next time, pause and ask: do I really need this?</p>
      <p className="text-tertiary text-[13px] italic mt-4 leading-relaxed">“{VERSES.covetousness.text}” — {VERSES.covetousness.ref}</p>
    </>
  )
}

export function SuccessAnimation({ amount, reflection, onContinue }: SuccessAnimationProps) {
  const good = reflection?.pleasesGod !== false
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 max-w-[560px] mx-auto z-[60] bg-bg flex flex-col items-center justify-center gap-6 px-8"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.05 }}
        className={good ? 'w-24 h-24 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center' : 'w-24 h-24 rounded-full flex items-center justify-center border-2'}
        style={good ? undefined : { background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', borderColor: 'var(--color-warning)' }}
      >
        {good ? (
          <motion.span className="text-accent-ink flex">
            <Check size={44} strokeWidth={3} />
          </motion.span>
        ) : (
          <span style={{ color: 'var(--color-warning)' }} className="flex">
            <Hourglass size={40} strokeWidth={2.4} />
          </span>
        )}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center max-w-[420px]">
        {reflection ? (
          <Message amount={amount} r={reflection} />
        ) : (
          <>
            <p className="text-white text-[26px] font-bold leading-none">{formatCurrency(amount)} saved</p>
            <p className="text-secondary text-[15px] mt-1">Expense logged</p>
          </>
        )}
      </motion.div>
      {reflection && onContinue && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="w-full max-w-[420px]">
          <Button onClick={onContinue}>{reflection.pleasesGod ? 'Continue' : 'I understand'}</Button>
        </motion.div>
      )}
    </motion.div>
  )
}
