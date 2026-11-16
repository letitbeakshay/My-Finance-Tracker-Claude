import { useState } from 'react'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseWizard } from './ExpenseWizard'
import { IncomeEntry } from './IncomeEntry'
import { EntryModeToggle, type EntryMode } from './EntryModeToggle'
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
  /** Open on Income instead of Expense (the "Add income" shortcut). */
  initialMode?: EntryMode
  /** From the income screen: go straight to recording what was set aside to give. */
  onGive?: (amount: number) => void
}

/** Adding an expense is a step-by-step flow; editing shows everything on one screen. Income is one tap away. */
export function AddExpenseScreen({ onDone, onCancel, editExpense, preset, initialMode = 'expense', onGive }: AddExpenseScreenProps) {
  const [mode, setMode] = useState<EntryMode>(initialMode)
  if (editExpense) return <ExpenseForm editExpense={editExpense} onDone={onDone} onCancel={onCancel} />
  const toggle = <EntryModeToggle value={mode} onChange={setMode} />
  if (mode === 'income') return <IncomeEntry onDone={onDone} onCancel={onCancel} onGive={onGive} toggle={toggle} />
  return <ExpenseWizard preset={preset} onDone={onDone} onCancel={onCancel} modeSwitch={toggle} />
}
