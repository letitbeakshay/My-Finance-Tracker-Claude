import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The header for full-screen pages: a round back button, the title centred in a light weight, and an
 * optional round button on the right. The two sides are the same width so the title stays centred.
 */
export function PageHeader({ title, onBack, right, className }: { title: ReactNode; onBack?: () => void; right?: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 mb-6', className)}>
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className="fp-chip w-11 h-11 text-white transition-transform duration-[var(--duration-quick)] ease-smooth-out active:scale-95">
          <ChevronLeft size={19} strokeWidth={1.8} />
        </button>
      ) : (
        <span />
      )}
      <h1 className="text-center text-white text-[24px] sm:text-[26px] font-normal tracking-[-0.02em] truncate">{title}</h1>
      <div className="flex justify-end">{right}</div>
    </div>
  )
}

/** A round frosted icon button for the right side of a PageHeader. */
export function HeaderIconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="fp-chip w-11 h-11 text-white transition-transform duration-[var(--duration-quick)] ease-smooth-out active:scale-95">
      {children}
    </button>
  )
}
