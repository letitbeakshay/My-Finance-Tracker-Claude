import type { PaymentMethod } from '../../types'
import { PAYMENT_METHOD_LABELS } from '../../types'
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS } from '../../lib/paymentIcons'
import { Chip } from '../ui/Chip'

interface PaymentMethodPickerProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAYMENT_METHODS.map((method) => (
        <Chip key={method} selected={value === method} onClick={() => onChange(method)} className="h-10 px-3.5 text-[14px]">
          <span>{PAYMENT_METHOD_ICONS[method]}</span>
          <span>{PAYMENT_METHOD_LABELS[method]}</span>
        </Chip>
      ))}
    </div>
  )
}
