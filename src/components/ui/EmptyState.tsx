import type { ReactNode } from 'react'
import { Receipt } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-5">
      <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center text-4xl">
        {icon ?? <Receipt size={32} className="text-tertiary" />}
      </div>
      <p className="text-secondary text-[16px]">{title}</p>
      {actionLabel && onAction && (
        <div className="w-full max-w-[240px]">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
