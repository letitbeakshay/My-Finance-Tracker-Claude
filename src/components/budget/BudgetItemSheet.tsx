import { useEffect, useMemo, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { useAllCategories } from '../../hooks/useLiveData'
import { budgetItemRepo } from '../../db/repository'
import { buildTree } from '../../lib/categoryTree'
import type { BudgetItem } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

interface BudgetItemSheetProps {
  open: boolean
  onClose: () => void
  /** When set, the sheet edits this item instead of adding one. */
  item?: BudgetItem | null
}

/** Add or edit one line of the monthly plan. */
export function BudgetItemSheet({ open, onClose, item }: BudgetItemSheetProps) {
  const categories = useAllCategories()
  // Every category, each sub-category right after its parent.
  const choices = useMemo(
    () => buildTree((categories ?? []).filter((c) => !c.archived)).flatMap((n) => [n.category, ...n.children]),
    [categories],
  )
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setAmount(item ? String(item.amount) : '')
      setCategoryIds(item?.categoryIds ?? [])
      setError('')
    }
  }, [open, item])

  const amountN = parseFloat(amount) || 0
  const canSave = !!name.trim() && amountN > 0 && !busy

  async function save() {
    if (!canSave) return
    setBusy(true)
    setError('')
    try {
      if (item) await budgetItemRepo.update(item.id, { name: name.trim(), amount: amountN, categoryIds })
      else await budgetItemRepo.add({ name: name.trim(), amount: amountN, categoryIds })
      onClose()
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!item) return
    setBusy(true)
    try {
      await budgetItemRepo.remove(item.id)
      onClose()
    } catch {
      setError('Could not delete. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-1">{item ? 'Edit plan item' : 'Add to your monthly plan'}</h2>
      <p className="text-secondary text-[14px] mb-5">A fixed amount you plan to spend every month, like an EMI or what you give at home.</p>

      <div className="flex flex-col gap-3 mb-5">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name, e.g. PNB EMI"
          className={FIELD}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder="Monthly amount"
          className={FIELD}
        />
      </div>

      {choices.length > 0 && (
        <div className="mb-5">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mb-2">
            Show spending from categories (pick one or more, optional)
          </p>
          <div className="flex flex-wrap gap-2 max-h-[26dvh] overflow-y-auto">
            <Chip selected={categoryIds.length === 0} onClick={() => setCategoryIds([])} className="h-9 px-3 text-[14px]">
              None
            </Chip>
            {choices.map((c) => (
              <Chip key={c.id} selected={categoryIds.includes(c.id)} onClick={() => setCategoryIds((cur) => (cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]))} className="h-9 px-3 text-[14px]">
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
      <div className="flex gap-3">
        {item && (
          <Button variant="secondary" onClick={remove} disabled={busy} className="!w-auto px-6 shrink-0 !text-danger">
            Delete
          </Button>
        )}
        <Button onClick={save} disabled={!canSave}>
          {item ? 'Save changes' : 'Add to plan'}
        </Button>
      </div>
    </BottomSheet>
  )
}
