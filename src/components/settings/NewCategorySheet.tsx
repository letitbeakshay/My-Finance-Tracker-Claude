import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/button'
import { Chip } from '../ui/Chip'
import { categoryRepo } from '../../db/repository'
import type { Category } from '../../types'
import { EmojiIcon } from '../ui/EmojiIcon'
import { PICKABLE_ICONS } from '../../lib/emojiIcons'

interface NewCategorySheetProps {
  open: boolean
  onClose: () => void
  onCreated: (category: Category) => void
  initial?: Category
  /** Top-level categories this one can be placed under. Omit to keep it simple (top level only). */
  parents?: Category[]
  /** A starting name for a new category (e.g. what you just searched for). */
  defaultName?: string
}

export function NewCategorySheet({ open, onClose, onCreated, initial, parents, defaultName }: NewCategorySheetProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'i:box')
  const [parentId, setParentId] = useState<string | null>(initial?.parentId ?? null)

  // Opening to add a category you just searched for starts with that name filled in.
  useEffect(() => {
    if (open && !initial && defaultName) setName(defaultName)
  }, [open, initial, defaultName])

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
    setIcon('i:box')
    setParentId(null)
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] font-bold mb-5">
        {initial ? 'Edit Category' : 'New Category'}
      </h2>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-secondary shrink-0">
          <EmojiIcon emoji={icon} name={name} size={26} />
        </div>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px]"
        />
      </div>

      {parents && parents.length > 0 && (
        <div className="mb-5">
          <p className="text-secondary text-[13px] font-medium mb-2.5">Place it under</p>
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

      <div className="grid grid-cols-6 gap-2 mb-6 max-h-[28dvh] overflow-y-auto">
        {Object.entries(PICKABLE_ICONS).map(([key, Icon]) => {
          const value = `i:${key}`
          const on = icon === value
          return (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={on}
              onClick={() => setIcon(value)}
              className="aspect-square rounded-2xl flex items-center justify-center border transition-colors"
              style={{
                borderColor: on ? 'var(--color-accent)' : 'var(--color-border)',
                background: on ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                color: on ? 'var(--color-accent-ink)' : 'var(--color-secondary)',
              }}
            >
              <Icon size={22} />
            </button>
          )
        })}
      </div>

      <Button onClick={handleSave} disabled={!name.trim()}>
        {initial ? 'Save Changes' : 'Create Category'}
      </Button>
    </BottomSheet>
  )
}
