import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { categoryRepo } from '../../db/repository'
import { CATEGORY_EMOJI_OPTIONS } from '../../lib/categoryEmoji'
import type { Category } from '../../types'

interface NewCategorySheetProps {
  open: boolean
  onClose: () => void
  onCreated: (category: Category) => void
  initial?: Category
  /** Top-level categories this one can be placed under. Omit to keep it simple (top level only). */
  parents?: Category[]
}

export function NewCategorySheet({ open, onClose, onCreated, initial, parents }: NewCategorySheetProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📦')
  const [parentId, setParentId] = useState<string | null>(initial?.parentId ?? null)

  async function handleSave() {
    if (!name.trim()) return
    if (initial) {
      await categoryRepo.rename(initial.id, name.trim(), icon)
      if (parents && (initial.parentId ?? null) !== parentId) await categoryRepo.setParent(initial.id, parentId)
      onCreated({ ...initial, name: name.trim(), icon, parentId: parentId ?? undefined })
    } else {
      const category = await categoryRepo.add({ name: name.trim(), icon, ...(parentId ? { parentId } : {}) })
      onCreated(category)
    }
    setName('')
    setIcon('📦')
    setParentId(null)
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

      {parents && parents.length > 0 && (
        <div className="mb-5">
          <p className="text-secondary text-[13px] font-medium mb-2.5 uppercase tracking-wide">Place it under</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={parentId === null} onClick={() => setParentId(null)} className="h-9 px-3 text-[14px]">
              Top level
            </Chip>
            {parents
              .filter((p) => p.id !== initial?.id)
              .map((p) => (
                <Chip key={p.id} selected={parentId === p.id} onClick={() => setParentId(p.id)} className="h-9 px-3 text-[14px]">
                  {p.name}
                </Chip>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-8 gap-2 mb-6">
        {CATEGORY_EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setIcon(e)}
            className="aspect-square rounded-xl flex items-center justify-center text-xl border"
            style={{
              borderColor: icon === e ? '#a1866f' : 'var(--color-border)',
              background: icon === e ? 'rgba(161,134,111,0.14)' : 'var(--color-surface)',
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
