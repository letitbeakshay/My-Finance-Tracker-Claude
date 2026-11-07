import { BottomSheet } from '../ui/BottomSheet'
import { BudgetItemForm } from './BudgetItemForm'
import { monthKey } from '../../lib/planMonth'
import { formatMonthLabel } from '../../lib/analytics'
import type { BudgetItem } from '../../types'

interface BudgetItemSheetProps {
  open: boolean
  onClose: () => void
  /** The month being planned. */
  month: Date
  /** When set, the sheet edits this item instead of adding one. */
  item?: BudgetItem | null
}

/** Add or edit one line of a month's plan. */
export function BudgetItemSheet({ open, onClose, month, item }: BudgetItemSheetProps) {
  const label = formatMonthLabel(month)
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-1">{item ? `Edit plan item` : `Add to ${label}`}</h2>
      <p className="text-secondary text-[14px] mb-5">A fixed amount you plan to spend, like an EMI or what you give at home.</p>
      {open && <BudgetItemForm key={item?.id ?? 'new'} item={item} month={monthKey(month)} monthLabel={label} onSaved={onClose} onDeleted={onClose} />}
    </BottomSheet>
  )
}
