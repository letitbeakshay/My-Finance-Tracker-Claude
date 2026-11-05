import { motion } from 'framer-motion'
import { Button } from '../ui/Button'
import { VERSES } from '../../lib/scripture'
import { formatCurrency } from '../../lib/currency'

interface CountTheCostSheetProps {
  amount: number
  onProceed: () => void
  onCancel: () => void
}

const QUESTIONS = [
  'Is this a need, or a want?',
  'Have I prayed about it?',
  'Can I pay for it without debt?',
  'Could I wait a few days?',
]

/** A gentle pause before a large "want" is saved. Sits above the add screen. */
export function CountTheCostSheet({ amount, onProceed, onCancel }: CountTheCostSheetProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 38 }}
        className="relative w-full max-w-[560px] bg-surface rounded-t-sheet border-t border-x border-border px-6 pt-6 pb-8"
      >
        <h2 className="text-white text-[21px] font-bold mb-1">Count the cost</h2>
        <p className="text-secondary text-[14px] mb-4">
          {formatCurrency(amount)} is a large want. Pause before you save it.
        </p>
        <p className="text-giving text-[14px] italic mb-4">
          “{VERSES.countCost.text}” — {VERSES.countCost.ref}
        </p>
        <ul className="flex flex-col gap-2 mb-6">
          {QUESTIONS.map((q) => (
            <li key={q} className="text-white text-[15px] flex gap-2.5">
              <span className="text-giving">•</span>
              {q}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Not now
          </Button>
          <Button onClick={onProceed}>I’ve prayed — save</Button>
        </div>
      </motion.div>
    </div>
  )
}
