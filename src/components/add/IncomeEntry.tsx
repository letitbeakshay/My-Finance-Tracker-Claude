import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { IncomeForm } from '../data/AddIncomeSheet'
import { usePaymentAccounts, useSettings } from '../../hooks/useLiveData'

/** Adding income from the entry screen, full screen, with the Expense / Income switch at the top. */
export function IncomeEntry({
  onDone,
  onCancel,
  onGive,
  toggle,
}: {
  onDone: () => void
  onCancel: () => void
  onGive?: (amount: number) => void
  toggle: ReactNode
}) {
  const settings = useSettings()
  const accounts = usePaymentAccounts()
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="fp-chip w-11 h-11 text-white active:scale-95 transition-transform duration-[var(--duration-quick)]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <h1 className="text-[19px] font-bold leading-tight">Income</h1>
          <div className="w-10" />
        </div>
        <div className="mt-3">{toggle}</div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-3 pb-10">
        <IncomeForm
          open
          onClose={onDone}
          bankAccounts={(accounts ?? []).filter((a) => a.type === 'bank_account')}
          givingPercent={settings?.givingPercent ?? 10}
          onGive={onGive}
        />
      </div>
    </div>
  )
}
