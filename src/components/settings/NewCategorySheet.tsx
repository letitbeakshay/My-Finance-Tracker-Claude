import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { categoryRepo } from '../../db/repository'
import type { Category } from '../../types'

const EMOJI_OPTIONS = [
  '🍔', '☕', '🛵', '🛍', '🍿', '🏠', '💊', '📱', '📚', '👕',
  '🎁', '✈️', '💼', '💡', '🏦', '💰', '📦', '🎮', '🐾', '🧾',
]

interface NewCategorySheetProps {
  open: boolean
  onClose: () => void
  onCreated: (category: Category) => void
  initial?: Category
}

export function NewCategorySheet({ open, onClose, onCreated, initial }: NewCategorySheetProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📦')

  async function handleSave() {
    if (!name.trim()) return
    if (initial) {
      await categoryRepo.rename(initial.id, name.trim(), icon)
      onCreated({ ...initial, name: name.trim(), icon })
    } else {
      const category = await categoryRepo.add({ name: name.trim(), icon })
      onCreated(category)
    }
    setName('')
    setIcon('📦')
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">
        {initial ? 'Edit Category' : 'New Category'}
      </h2>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-2xl shrink-0">
          {icon}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px]"
        />
      </div>

      <div className="grid grid-cols-8 gap-2 mb-6">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setIcon(e)}
            className="aspect-square rounded-xl flex items-center justify-center text-xl border"
            style={{
              borderColor: icon === e ? '#24d968' : 'var(--color-border)',
              background: icon === e ? 'rgba(36,217,104,0.14)' : 'var(--color-surface)',
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <Button onClick={handleSave} disabled={!name.trim()}>
        {initial ? 'Save Changes' : 'Create Category'}
      </Button>
    </BottomSheet>
  )
}
