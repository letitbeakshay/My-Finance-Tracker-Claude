import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import type { Category, ExpenseType, PaymentMethod } from '../../types'
import { EXPENSE_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS } from '../../lib/paymentIcons'

export interface Filters {
  categoryId: string | null
  type: ExpenseType | null
  paymentMethod: PaymentMethod | null
}

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  filters: Filters
  onChange: (filters: Filters) => void
}

const TYPES: ExpenseType[] = ['need', 'want', 'savings']

export function FilterSheet({ open, onClose, categories, filters, onChange }: FilterSheetProps) {
  function toggle<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? null : value })
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">Filters</h2>

      <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">Type</p>
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPES.map((t) => (
          <Chip key={t} selected={filters.type === t} onClick={() => toggle('type', t)}>
            {EXPENSE_TYPE_LABELS[t]}
          </Chip>
        ))}
      </div>

      <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
        Payment Method
      </p>
      <div className="flex gap-2 flex-wrap mb-6">
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} selected={filters.paymentMethod === m} onClick={() => toggle('paymentMethod', m)}>
            {PAYMENT_METHOD_ICONS[m]} {PAYMENT_METHOD_LABELS[m]}
          </Chip>
        ))}
      </div>

      <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">
        Category
      </p>
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((c) => (
          <Chip key={c.id} selected={filters.categoryId === c.id} onClick={() => toggle('categoryId', c.id)}>
            {c.icon} {c.name}
          </Chip>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => onChange({ categoryId: null, type: null, paymentMethod: null })}
        >
          Clear
        </Button>
        <Button onClick={onClose}>Apply</Button>
      </div>
    </BottomSheet>
  )
}
