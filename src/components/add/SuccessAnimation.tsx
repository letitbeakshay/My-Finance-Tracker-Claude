import { motion } from 'framer-motion'
import { formatCurrency } from '../../lib/currency'

interface SuccessAnimationProps {
  amount: number
}

export function SuccessAnimation({ amount }: SuccessAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 max-w-[560px] mx-auto z-[60] bg-bg flex flex-col items-center justify-center gap-6"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.05 }}
        className="w-24 h-24 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center"
      >
        <motion.svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="#87c696"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-white text-[26px] font-bold leading-none">{formatCurrency(amount)} saved</p>
        <p className="text-secondary text-[15px] mt-1">Expense logged</p>
      </motion.div>
    </motion.div>
  )
}
