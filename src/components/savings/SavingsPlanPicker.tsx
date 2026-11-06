import { useState } from 'react'
import clsx from 'clsx'
import { SavingsPlanSheet } from './SavingsPlanSheet'
import { useExpenses, useSavingsPlans } from '../../hooks/useLiveData'
import { formatCurrency } from '../../lib/currency'
import { kindMeta, planProgress } from '../../lib/savings'

/** Choose which savings plan this money goes into. */
export function SavingsPlanPicker({ value, onChange, showProgress }: { value: string | null; onChange: (id: string | null) => void; showProgress?: boolean }) {
  const plans = useSavingsPlans()
  const expenses = useExpenses()
  const [creating, setCreating] = useState(false)
  const open = (plans ?? []).filter((p) => !p.closed)

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {open.map((p) => {
          const selected = value === p.id
          return (
            <button key={p.id} type="button" onClick={() => onChange(p.id)} aria-pressed={selected}
              className={clsx('h-[58px] rounded-2xl border flex items-center gap-3 px-4 text-left transition-colors active:scale-[0.98]', selected ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}>
              <span className="text-[22px]">{kindMeta(p.kind).icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold truncate">{p.name}</span>
                <span className="block text-[12px] opacity-70 truncate">
                  {showProgress && expenses
                    ? (() => {
                        const pr = planProgress(p, expenses, new Date())
                        return `${formatCurrency(pr.saved)}${p.target ? ` of ${formatCurrency(p.target)}` : ''} saved`
                      })()
                    : `${kindMeta(p.kind).label}${p.institution ? ` · ${p.institution}` : ''}`}
                </span>
              </span>
            </button>
          )
        })}
        <button type="button" onClick={() => setCreating(true)} className="h-[50px] rounded-2xl border border-dashed border-border text-secondary text-[15px] font-medium flex items-center justify-center gap-2">
          ＋ New savings plan
        </button>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-tertiary text-[13px] font-medium h-9">
            Don’t link to a plan
          </button>
        )}
      </div>
      <SavingsPlanSheet open={creating} onClose={() => setCreating(false)} onSaved={(pl) => pl && onChange(pl.id)} />
    </>
  )
}
