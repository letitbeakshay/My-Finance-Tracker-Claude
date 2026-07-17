import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDragEnd' | 'onDrag'
>

interface ButtonProps extends NativeButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ children, className, variant = 'primary', ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={clsx(
        'w-full h-14 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-colors',
        variant === 'primary' && 'bg-accent text-black active:bg-accent-dim',
        variant === 'secondary' && 'bg-surface text-white border border-border',
        variant === 'ghost' && 'bg-transparent text-secondary',
        rest.disabled && 'opacity-40',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
