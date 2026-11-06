import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { budgetRepo } from '../../db/repository'
import type { Category } from '../../types'

/** Set, change or remove the monthly limit of one category. */
export function CategoryLimitForm({
  category,
  current,
  fromPlan,
  onSaved,
  autoFocus = true,
}: {
  category: Category
  current?: number
  fromPlan: boolean
  /** Called with the new limit, or undefined when it was removed. */
  onSaved: (limit: number | undefined) => void
  autoFocus?: boolean
}) {
  const [text, setText] = useState(current ? String(current) : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setText(current ? String(current) : '')
    setError('')
  }, [category.id, current])

  async function save(value: number) {
    setBusy(true)
    setError('')
    try {
      await budgetRepo.set(category.id, value)
      onSaved(value > 0 ? value : undefined)
    } catch {
      setError('Could not save. The database needs an update: use “Copy the SQL” in the box at the top of the app.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <input
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9.]/g, ''))}
        inputMode="decimal"
        placeholder="Limit for each month, e.g. 3000"
        className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary"
      />
      <p className="text-tertiary text-[12px] mt-2 leading-relaxed">
        Covers everything under {category.name}.
        {fromPlan && ' Right now this comes from your monthly plan; a number here replaces it.'}
      </p>
      {error && <p className="text-danger text-[13px] mt-2">{error}</p>}
      <div className="flex gap-3 mt-4">
        {current !== undefined && !fromPlan && (
          <Button variant="secondary" className="!w-auto px-6 shrink-0 !text-danger" disabled={busy} onClick={() => save(0)}>
            Remove
          </Button>
        )}
        <Button onClick={() => save(parseFloat(text) || 0)} disabled={busy || !(parseFloat(text) > 0)}>
          Save limit
        </Button>
      </div>
    </>
  )
}
