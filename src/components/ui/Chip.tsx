import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function Chip({ children, selected, onClick, className }: ChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={clsx(
        'shrink-0 rounded-chip px-4 h-11 flex items-center gap-1.5 text-[15px] font-medium border transition-colors',
        selected
          ? 'bg-accent-soft border-accent text-accent'
          : 'bg-surface border-border text-white',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
