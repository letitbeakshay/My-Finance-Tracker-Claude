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
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
