import { useEffect, useState } from 'react'
import { Reorder } from 'framer-motion'
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
          className="text-accent text-[13px] font-semibold"
        >
          {reordering ? 'Done' : 'Edit Order'}
        </button>
      </div>

      {reordering ? (
        <Reorder.Group
          axis="x"
          values={order}
          onReorder={setOrder}
          className="flex gap-2.5 overflow-x-auto -mx-6 px-6 pb-1"
        >
          {order.map((c) => (
            <Reorder.Item
              key={c.id}
              value={c}
              className="shrink-0 rounded-chip px-3.5 h-11 flex items-center gap-1.5 text-[15px] font-medium border bg-surface border-border text-white cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.06, zIndex: 10 }}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
              <span className="text-tertiary text-[12px] ml-1">⠿</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto -mx-6 px-6 pb-1">
          {categories.map((c) => (
            <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)}>
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </Chip>
          ))}
          <Chip onClick={() => setCreating(true)}>
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
