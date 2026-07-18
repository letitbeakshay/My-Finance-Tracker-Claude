import { useMemo, useState } from 'react'
import type { PaymentAccount, PaymentAccountType } from '../../types'
import { Chip } from '../ui/Chip'
import { NewPaymentAccountSheet } from '../settings/NewPaymentAccountSheet'

interface PaymentAccountPickerProps {
  accounts: PaymentAccount[]
  accountType: PaymentAccountType
  value: string | null
  onChange: (accountId: string) => void
}

export function PaymentAccountPicker({
  accounts,
  accountType,
  value,
  onChange,
}: PaymentAccountPickerProps) {
  const [creating, setCreating] = useState(false)
  const filtered = useMemo(
    () => accounts.filter((a) => a.type === accountType),
    [accounts, accountType],
  )

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto -mx-6 px-6 pb-1">
        {filtered.map((a) => (
          <Chip key={a.id} selected={value === a.id} onClick={() => onChange(a.id)}>
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </Chip>
        ))}
        <Chip onClick={() => setCreating(true)}>
          <span>＋</span>
          <span>{accountType === 'credit_card' ? 'Add Card' : 'Add Account'}</span>
        </Chip>
      </div>

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
