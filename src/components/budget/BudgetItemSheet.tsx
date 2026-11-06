import { BottomSheet } from '../ui/BottomSheet'
import { BudgetItemForm } from './BudgetItemForm'
import type { BudgetItem } from '../../types'

interface BudgetItemSheetProps {
  open: boolean
  onClose: () => void
  /** When set, the sheet edits this item instead of adding one. */
  item?: BudgetItem | null
}

/** Add or edit one line of the monthly plan. */
export function BudgetItemSheet({ open, onClose, item }: BudgetItemSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-1">{item ? 'Edit plan item' : 'Add to your monthly plan'}</h2>
      <p className="text-secondary text-[14px] mb-5">A fixed amount you plan to spend every month, like an EMI or what you give at home.</p>
      {open && <BudgetItemForm key={item?.id ?? 'new'} item={item} onSaved={onClose} onDeleted={onClose} />}
    </BottomSheet>
  )
}
