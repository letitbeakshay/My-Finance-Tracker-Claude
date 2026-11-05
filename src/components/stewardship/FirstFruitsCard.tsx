import { Check, HandHeart } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { formatCurrency } from '../../lib/currency'
import { VERSES } from '../../lib/scripture'
import type { MonthPlan } from '../../lib/stewardship'

interface FirstFruitsCardProps {
  plan: MonthPlan
  givingPercent: number
  /** Opens the giving entry, pre-filled with what is still to give. */
  onGive: (amount: number) => void
  compact?: boolean
}

export function FirstFruitsCard({ plan, givingPercent, onGive, compact }: FirstFruitsCardProps) {
  const hasIncome = plan.income > 0
  const done = hasIncome && plan.givingRemaining <= 0
  const progress = plan.givingTarget > 0 ? Math.min(100, (plan.given / plan.givingTarget) * 100) : 0

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-full bg-giving-soft text-giving flex items-center justify-center shrink-0">
          <HandHeart size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-white text-[17px] font-bold leading-tight">First fruits</h2>
          <p className="text-tertiary text-[12px]">{givingPercent}% of what I receive, given first</p>
        </div>
      </div>

      {hasIncome ? (
        <>
          <p className="text-white text-[28px] font-bold tabular-nums leading-none mb-1">
            {formatCurrency(plan.given)}
            <span className="text-tertiary text-[15px] font-medium"> of {formatCurrency(plan.givingTarget)}</span>
          </p>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden my-3">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: '#a47b22' }}
            />
          </div>
          {done ? (
            <p className="text-giving text-[14px] font-medium flex items-center gap-1.5">
              <Check size={16} /> Given faithfully this month
            </p>
          ) : (
            <p className="text-secondary text-[14px]">
              {formatCurrency(plan.givingRemaining)} still to give this month
            </p>
          )}
        </>
      ) : (
        <p className="text-secondary text-[14px] leading-relaxed">
          Record your income and your first fruits are set aside for God before anything else.
        </p>
      )}

      {!compact && (
        <p className="text-tertiary text-[12px] italic mt-4">
          “{VERSES.firstFruits.text}” — {VERSES.firstFruits.ref}
        </p>
      )}

      <div className="mt-4">
        <Button variant={done || !hasIncome ? 'secondary' : 'primary'} onClick={() => onGive(plan.givingRemaining)}>
          {done || !hasIncome ? 'Record giving' : 'Give now'}
        </Button>
      </div>
    </Card>
  )
}
