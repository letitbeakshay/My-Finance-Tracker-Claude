import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Money } from './Money'

/**
 * The headline panel of a screen: deep green, a big amount, and a few frosted pills.
 * Everything inside uses white, so it stays readable on the green.
 */
export function Hero({
  label,
  value,
  of,
  pills,
  children,
  className,
}: {
  label: string
  /** The big amount. */
  value: number
  /** The amount it is out of, shown lighter beside the big one. */
  of?: ReactNode
  pills?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('hero rounded-card p-6 sm:p-7 shadow-card text-white', className)} style={{ color: '#fff' }}>
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
          {pills && <div className="flex flex-wrap justify-end gap-2">{pills}</div>}
        </div>
        <p className="mt-3 leading-none tracking-tight">
          <Money value={value} className="text-[42px] sm:text-[48px] font-bold tabular-nums" />
          {of && <span className="text-[17px] font-medium opacity-80 ml-2 align-baseline">{of}</span>}
        </p>
        {children}
      </div>
    </div>
  )
}

export function HeroPill({ children }: { children: ReactNode }) {
  return <span className="hero-pill rounded-full px-3 h-7 inline-flex items-center gap-1 text-[12px] font-semibold">{children}</span>
}
