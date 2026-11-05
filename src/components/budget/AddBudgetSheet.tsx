import { useEffect, useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { budgetRepo, categoryRepo } from '../../db/repository'
import { GIVING_CATEGORIES } from '../../db/seed'
import { CATEGORY_EMOJI_OPTIONS } from '../../lib/categoryEmoji'
import type { Category } from '../../types'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary'

const SUGGESTIONS = ['Family allowance', 'Outside food', 'Groceries', 'Subscriptions']
const GIVING_IDS = new Set(GIVING_CATEGORIES.map((c) => c.id))

interface AddBudgetSheetProps {
  open: boolean
  onClose: () => void
  categories: Category[]
  /** Category ids that already have a budget. */
  budgetedIds: Set<string>
}

/**
 * Creates a budget for any name. A name that matches an existing category reuses
 * it; a new name creates a real category, so it also shows up when adding expenses.
 */
export function AddBudgetSheet({ open, onClose, categories, budgetedIds }: AddBudgetSheetProps) {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [icon, setIcon] = useState('📦')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setLimit('')
      setIcon('📦')
      setError('')
    }
  }, [open])

  const trimmed = name.trim()
  const match = categories.find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase())
  const isNew = !!trimmed && !match
  const alreadyBudgeted = !!match && budgetedIds.has(match.id)
  const limitN = parseFloat(limit) || 0
  const canSave = !!trimmed && limitN > 0 && !alreadyBudgeted && !saving

  const existingChoices = categories.filter((c) => !budgetedIds.has(c.id) && !GIVING_IDS.has(c.id))
  const suggestions = SUGGESTIONS.filter(
    (s) => !categories.some((c) => c.name.trim().toLowerCase() === s.toLowerCase()),
  )

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const category = match ?? (await categoryRepo.add({ name: trimmed, icon }))
      await budgetRepo.set(category.id, limitN)
      onClose()
    } catch {
      setError('Could not save. Make sure the latest supabase/schema.sql has been run.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-1">Add budget</h2>
      <p className="text-secondary text-[14px] mb-5">
        Name it anything. It also becomes a category when you add an expense.
      </p>

      <div className="flex flex-col gap-3 mb-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Family allowance"
          className={FIELD}
        />
        <input
          value={limit}
          onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ''))}
          inputMode="decimal"
          placeholder="Monthly limit"
          className={FIELD}
        />
      </div>

      {(existingChoices.length > 0 || suggestions.length > 0) && (
        <div className="mb-5">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mb-2">Quick pick</p>
          <div className="flex flex-wrap gap-2">
            {existingChoices.map((c) => (
              <Chip key={c.id} selected={match?.id === c.id} onClick={() => setName(c.name)} className="h-9 px-3 text-[14px]">
                {c.name}
              </Chip>
            ))}
            {suggestions.map((s) => (
              <Chip key={s} selected={trimmed.toLowerCase() === s.toLowerCase()} onClick={() => setName(s)} className="h-9 px-3 text-[14px]">
                {s}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {isNew && (
        <div className="mb-5">
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide mb-2">Icon</p>
          <div className="grid grid-cols-10 gap-1.5">
            {CATEGORY_EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className="aspect-square rounded-lg flex items-center justify-center text-[17px] border"
                style={{
                  borderColor: icon === e ? '#a1866f' : 'var(--color-border)',
                  background: icon === e ? 'rgba(161,134,111,0.14)' : 'var(--color-surface)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {alreadyBudgeted && (
        <p className="text-secondary text-[14px] mb-3">“{match?.name}” already has a budget. Edit its limit in the list.</p>
      )}
      {error && <p className="text-danger text-[14px] mb-3">{error}</p>}

      <Button onClick={handleSave} disabled={!canSave}>
        {isNew ? 'Create & add budget' : 'Add budget'}
      </Button>
    </BottomSheet>
  )
}
