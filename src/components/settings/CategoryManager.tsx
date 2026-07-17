import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAllCategories } from '../../hooks/useLiveData'
import { categoryRepo } from '../../db/repository'
import { NewCategorySheet } from './NewCategorySheet'
import type { Category } from '../../types'

export function CategoryManager() {
  const categories = useAllCategories()
  const [creating, setCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const active = (categories ?? []).filter((c) => !c.archived)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-[17px] font-bold">Categories</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-accent text-[14px] font-semibold"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {active.map((c) => (
          <motion.div
            key={c.id}
            layout
            className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 h-14"
          >
            <span className="text-xl">{c.icon}</span>
            <span className="text-white text-[15px] flex-1">{c.name}</span>
            <button
              type="button"
              onClick={() => setEditingCategory(c)}
              className="text-secondary text-[13px] font-medium px-2"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => categoryRepo.remove(c.id)}
              className="text-danger text-[13px] font-medium px-2"
            >
              Delete
            </button>
          </motion.div>
        ))}
      </div>

      <NewCategorySheet open={creating} onClose={() => setCreating(false)} onCreated={() => setCreating(false)} />
      <NewCategorySheet
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onCreated={() => setEditingCategory(null)}
        initial={editingCategory ?? undefined}
      />
    </div>
  )
}
