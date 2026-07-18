import { useEffect, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { SegmentedControl } from '../ui/SegmentedControl'
import { paymentAccountRepo } from '../../db/repository'
import type { PaymentAccount, PaymentAccountType } from '../../types'

const TYPE_OPTIONS: { value: PaymentAccountType; label: string; color: string }[] = [
  { value: 'bank_account', label: 'Bank Account', color: '#5b9dff' },
  { value: 'credit_card', label: 'Credit Card', color: '#ff9f43' },
]

const ICON_BY_TYPE: Record<PaymentAccountType, string> = {
  bank_account: '🏦',
  credit_card: '💳',
}

interface NewPaymentAccountSheetProps {
  open: boolean
  onClose: () => void
  onSaved: (account: PaymentAccount) => void
  initial?: PaymentAccount
  defaultType?: PaymentAccountType
}

export function NewPaymentAccountSheet({
  open,
  onClose,
  onSaved,
  initial,
  defaultType,
}: NewPaymentAccountSheetProps) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [type, setType] = useState<PaymentAccountType>(initial?.type ?? defaultType ?? 'bank_account')
  const [bankName, setBankName] = useState(initial?.bankName ?? '')
  const [last4, setLast4] = useState(initial?.last4 ?? '')

  useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? '')
      setType(initial?.type ?? defaultType ?? 'bank_account')
      setBankName(initial?.bankName ?? '')
      setLast4(initial?.last4 ?? '')
    }
  }, [open, initial, defaultType])

  async function handleSave() {
    if (!label.trim()) return
    const payload = {
      label: label.trim(),
      type,
      bankName: bankName.trim() || undefined,
      last4: last4.trim() || undefined,
      icon: ICON_BY_TYPE[type],
    }
    if (initial) {
      await paymentAccountRepo.update(initial.id, payload)
      onSaved({ ...initial, ...payload })
    } else {
      const account = await paymentAccountRepo.add(payload)
      onSaved(account)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">
        {initial ? 'Edit Account' : 'New Bank Account / Card'}
      </h2>

      <div className="mb-5">
        <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={type === 'credit_card' ? 'e.g. HDFC Regalia' : 'e.g. SBI Savings'}
          className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary"
        />
        <input
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          placeholder="Bank name (optional)"
          className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[15px] placeholder:text-tertiary"
        />
        <input
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="Last 4 digits (optional)"
          className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[15px] placeholder:text-tertiary"
        />
      </div>

      <Button onClick={handleSave} disabled={!label.trim()}>
        {initial ? 'Save Changes' : 'Add Account'}
      </Button>
    </BottomSheet>
  )
}
