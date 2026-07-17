import { useState } from 'react'
import type { Category } from '../../types'
import { Chip } from '../ui/Chip'
import { NewCategorySheet } from '../settings/NewCategorySheet'

interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  const [creating, setCreating] = useState(false)

  return (
    <>
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
