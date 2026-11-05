import { ExpenseForm } from './ExpenseForm'
import { ExpenseWizard } from './ExpenseWizard'
import type { Expense, ExpenseType } from '../../types'

/** Pre-filled values, e.g. when opened from "Give now". */
export interface AddExpensePreset {
  type?: ExpenseType
  categoryId?: string
  amount?: string
}

interface AddExpenseScreenProps {
  onDone: () => void
  onCancel: () => void
  editExpense?: Expense
  preset?: AddExpensePreset
}

/** Adding is a step-by-step flow; editing shows everything on one screen. */
export function AddExpenseScreen({ onDone, onCancel, editExpense, preset }: AddExpenseScreenProps) {
  if (editExpense) return <ExpenseForm editExpense={editExpense} onDone={onDone} onCancel={onCancel} />
  return <ExpenseWizard preset={preset} onDone={onDone} onCancel={onCancel} />
}
