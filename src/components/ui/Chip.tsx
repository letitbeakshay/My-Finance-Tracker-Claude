import type { ReactNode } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
}

/** A choice chip: the shadcn Toggle, pressed when selected. */
export function Chip({ children, selected, onClick, className }: ChipProps) {
  return (
    <Toggle pressed={!!selected} onPressedChange={() => onClick?.()} className={cn('shrink-0', className)}>
      {children}
    </Toggle>
  )
}
