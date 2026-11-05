import { useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import type { Category } from '../../types'
import { Chip } from '../ui/Chip'
import { NewCategorySheet } from '../settings/NewCategorySheet'
import { categoryRepo } from '../../db/repository'

interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const [creating, setCreating] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [order, setOrder] = useState(categories)

  useEffect(() => {
    if (!reordering) setOrder(categories)
  }, [categories, reordering])

  async function handleDone() {
    setReordering(false)
    await categoryRepo.reorder(order.map((c) => c.id))
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-secondary text-[13px] font-medium uppercase tracking-wide">Category</p>
        <button
          type="button"
          onClick={() => (reordering ? handleDone() : setReordering(true))}
          className="text-accent-ink text-[13px] font-semibold"
        >
          {reordering ? 'Done' : 'Edit Order'}
        </button>
      </div>

      {reordering ? (
        <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-2">
          {order.map((c) => (
            <Reorder.Item
              key={c.id}
              value={c}
              className="rounded-xl px-4 h-12 flex items-center gap-3 text-[15px] font-medium border bg-surface border-border text-white cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.02, zIndex: 10 }}
            >
              <span>{c.icon}</span>
              <span className="flex-1 truncate">{c.name}</span>
              <GripVertical size={18} className="text-tertiary shrink-0" />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)} className="h-10 px-3.5 text-[14px]">
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </Chip>
          ))}
          <Chip onClick={() => setCreating(true)} className="h-10 px-3.5 text-[14px]">
            <span>＋</span>
            <span>New</span>
          </Chip>
        </div>
      )}

      <NewCategorySheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(category) => {
          setCreating(false)
          onChange(category.id)
        }}
      />
    </>
  )
}
