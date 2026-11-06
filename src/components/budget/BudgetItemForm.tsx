import { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { useAllCategories } from '../../hooks/useLiveData'
import { budgetItemRepo } from '../../db/repository'
import { buildTree } from '../../lib/categoryTree'
import type { BudgetItem } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

export interface BudgetItemValues {
  name: string
  amount: number
  categoryIds: string[]
}

/** The fields for one plan item: name, monthly amount and the categories whose spending it tracks. */
export function BudgetItemForm({
  item,
  onSaved,
  onDeleted,
  autoFocus = true,
}: {
  item?: BudgetItem | null
  onSaved: (values: BudgetItemValues) => void
  onDeleted?: () => void
  autoFocus?: boolean
}) {
  const categories = useAllCategories()
  const choices = useMemo(
    () => buildTree((categories ?? []).filter((c) => !c.archived)).flatMap((n) => [n.category, ...n.children]),
    [categories],
  )
  const [name, setName] = useState(item?.name ?? '')
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [categoryIds, setCategoryIds] = useState<string[]>(item?.categoryIds ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setName(item?.name ?? '')
    setAmount(item ? String(item.amount) : '')
    setCategoryIds(item?.categoryIds ?? [])
    setError('')
    setConfirming(false)
  }, [item])

  const amountN = parseFloat(amount) || 0
  const canSave = !!name.trim() && amountN > 0 && !busy

  async function save() {
    if (!canSave) return
    setBusy(true)
    setError('')
    try {
      const values = { name: name.trim(), amount: amountN, categoryIds }
      if (item) await budgetItemRepo.update(item.id, values)
      else await budgetItemRepo.add(values)
      onSaved(values)
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!item) return
    if (!confirming) return setConfirming(true)
    setBusy(true)
    try {
      await budgetItemRepo.remove(item.id)
      onDeleted?.()
    } catch {
      setError('Could not delete. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-5">
        <input autoFocus={autoFocus} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. PNB EMI" className={FIELD} />
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
            {confirming ? 'Tap again' : 'Delete'}
          </Button>
        )}
        <Button onClick={save} disabled={!canSave}>
          {item ? 'Save changes' : 'Add to plan'}
        </Button>
      </div>
    </>
  )
}
