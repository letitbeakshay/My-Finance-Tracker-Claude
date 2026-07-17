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
    <div className="flex gap-2.5 overflow-x-auto -mx-6 px-6 pb-1">
      {PAYMENT_METHODS.map((method) => (
        <Chip key={method} selected={value === method} onClick={() => onChange(method)}>
          <span>{PAYMENT_METHOD_ICONS[method]}</span>
          <span>{PAYMENT_METHOD_LABELS[method]}</span>
        </Chip>
      ))}
    </div>
  )
}
