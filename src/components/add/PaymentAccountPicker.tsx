import { useMemo, useState } from 'react'
import type { PaymentAccount, PaymentAccountType } from '../../types'
import { Chip } from '../ui/Chip'
import { NewPaymentAccountSheet } from '../settings/NewPaymentAccountSheet'

interface PaymentAccountPickerProps {
  accounts: PaymentAccount[]
  accountType: PaymentAccountType
  value: string | null
  onChange: (accountId: string) => void
  /** Large full-width choices. */
  big?: boolean
}

export function PaymentAccountPicker({
  accounts,
  accountType,
  value,
  onChange,
  big,
}: PaymentAccountPickerProps) {
  const [creating, setCreating] = useState(false)
  const filtered = useMemo(
    () => accounts.filter((a) => a.type === accountType || (accountType === 'debit_card' && a.type === 'bank_account')),
    [accounts, accountType],
  )

  const addLabel = accountType === 'bank_account' ? 'Add Account' : 'Add Card'
  return (
    <>
      {big ? (
        <div className="flex flex-col gap-2.5">
          {filtered.map((a) => {
            const selected = value === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange(a.id)}
                aria-pressed={selected}
                className={`h-[60px] rounded-2xl border flex items-center gap-3 px-4 text-left transition-colors active:scale-[0.98] ${selected ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white'}`}
              >
                <span className="text-[24px]">{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold truncate">{a.label}</span>
                  {(a.bankName || a.last4) && (
                    <span className="block text-[12px] opacity-70 truncate">{[a.bankName, a.last4 ? `•••• ${a.last4}` : null].filter(Boolean).join(' · ')}</span>
                  )}
                </span>
              </button>
            )
          })}
          <button type="button" onClick={() => setCreating(true)} className="h-[52px] rounded-2xl border border-dashed border-border text-secondary text-[15px] font-medium flex items-center justify-center gap-2">
            ＋ {addLabel}
          </button>
        </div>
      ) : (
      <div className="flex flex-wrap gap-2">
        {filtered.map((a) => (
          <Chip key={a.id} selected={value === a.id} onClick={() => onChange(a.id)} className="h-10 px-3.5 text-[14px]">
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </Chip>
        ))}
        <Chip onClick={() => setCreating(true)} className="h-10 px-3.5 text-[14px]">
          <span>＋</span>
          <span>{accountType === 'bank_account' ? 'Add Account' : 'Add Card'}</span>
        </Chip>
      </div>
      )}

      <NewPaymentAccountSheet
        open={creating}
        onClose={() => setCreating(false)}
        defaultType={accountType}
        onSaved={(account) => {
          setCreating(false)
          onChange(account.id)
        }}
      />
    </>
  )
}
