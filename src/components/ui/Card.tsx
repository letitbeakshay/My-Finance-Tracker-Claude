import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
}

export function Card({ children, className, padded = true, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-card border border-border rounded-card',
        padded && 'p-5',
        className,
      )}
      style={{
        boxShadow: '0 1px 2px rgba(40,36,20,0.04), 0 6px 18px rgba(40,36,20,0.06)',
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
