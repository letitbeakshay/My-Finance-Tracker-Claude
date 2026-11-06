import type { PaymentMethod } from '../../types'
import { PAYMENT_METHOD_LABELS } from '../../types'
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS } from '../../lib/paymentIcons'
import clsx from 'clsx'
import { Chip } from '../ui/Chip'

interface PaymentMethodPickerProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  /** Large tap targets, with UPI as the big first choice. */
  big?: boolean
}

export function PaymentMethodPicker({ value, onChange, big }: PaymentMethodPickerProps) {
  if (big) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const hero = method === 'upi'
          const selected = value === method
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              aria-pressed={selected}
              className={clsx(
                'rounded-2xl border flex items-center gap-3 px-4 text-left transition-colors active:scale-[0.98]',
                hero ? 'col-span-2 h-[76px]' : 'h-16',
                selected ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white',
              )}
            >
              <span className={hero ? 'text-[30px]' : 'text-[22px]'}>{PAYMENT_METHOD_ICONS[method]}</span>
              <span className="min-w-0">
                <span className={clsx('block font-semibold', hero ? 'text-[20px]' : 'text-[16px]')}>{PAYMENT_METHOD_LABELS[method]}</span>
                {hero && <span className="block text-[12px] opacity-70">GPay, PhonePe, Paytm, any UPI app</span>}
              </span>
            </button>
          )
        })}
      </div>
    )
  }
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
