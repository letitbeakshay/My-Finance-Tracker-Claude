import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Repeat } from 'lucide-react'
import { useAllCategories, useExpenses, useSavingsPlans } from '../../hooks/useLiveData'
import { expenseRepo } from '../../db/repository'
import { frequentExpenses, type Frequent } from '../../lib/frequent'
import { formatCurrency } from '../../lib/currency'
import { showUndo } from '../../lib/toast'
import { CategoryIcon } from '../ui/CategoryIcon'

/** One tap adds the same expense again, today: the last one you added, and the ones you add most. */
export function QuickRepeat({ onSaved, className }: { onSaved?: () => void; className?: string }) {
  const expenses = useExpenses()
  const categories = useAllCategories()
  const plans = useSavingsPlans()
  const [busy, setBusy] = useState<string | null>(null)

  const { last, top } = useMemo(() => frequentExpenses(expenses ?? [], categories ?? []), [expenses, categories])
  const byId = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const chips: (Frequent & { isLast?: boolean })[] = [...(last ? [{ ...last, isLast: true }] : []), ...top].slice(0, 6)
  if (chips.length === 0) return null

  async function repeat(f: Frequent) {
    if (busy) return
    setBusy(f.key)
    try {
      const t = f.template
      const planStillThere = t.savingsPlanId && (plans ?? []).some((p) => p.id === t.savingsPlanId)
      const saved = await expenseRepo.add({
        amount: t.amount,
        categoryId: t.categoryId,
        type: t.type,
        paymentMethod: t.paymentMethod,
        accountId: t.accountId,
        notes: t.notes,
        date: format(new Date(), 'yyyy-MM-dd'),
        pleasesGod: t.pleasesGod,
        savingsPlanId: planStillThere ? t.savingsPlanId : undefined,
      })
      showUndo(`Added ${formatCurrency(t.amount)} · ${f.label}`, () => expenseRepo.remove(saved.id))
      onSaved?.()
    } catch {
      showUndo('Could not add it. Please try again.', () => undefined, 3000)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={className}>
      <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide flex items-center gap-1.5">
        <Repeat size={13} /> Quick add: tap to repeat
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const cat = byId.get(c.template.categoryId)
          return (
            <button
              key={(c.isLast ? 'last:' : '') + c.key}
              type="button"
              onClick={() => repeat(c)}
              disabled={busy !== null}
              aria-label={`Add ${formatCurrency(c.amount)} ${c.label} again`}
              className="h-11 pl-2.5 pr-3.5 rounded-full border border-border bg-surface flex items-center gap-2 text-left active:scale-95 transition-transform disabled:opacity-60"
            >
              <span className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-secondary shrink-0">
                {cat && <CategoryIcon category={cat} size={14} />}
              </span>
              <span className="min-w-0">
                <span className="block text-white text-[14px] font-semibold leading-tight truncate max-w-[130px]">
                  {c.isLast && <span className="text-accent-ink text-[11px] font-bold uppercase mr-1">Last</span>}
                  {c.label}
                </span>
                <span className="block text-tertiary text-[12px] leading-tight tabular-nums">{formatCurrency(c.amount)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
