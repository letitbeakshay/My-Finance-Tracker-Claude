import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAllCategories } from '../../hooks/useLiveData'
import { categoryRepo } from '../../db/repository'
import { NewCategorySheet } from './NewCategorySheet'
import { buildTree } from '../../lib/categoryTree'
import type { Category } from '../../types'

export function CategoryManager() {
  const categories = useAllCategories()
  const [creating, setCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const active = (categories ?? []).filter((c) => !c.archived)
  const tree = buildTree(active)
  const parents = tree.map((n) => n.category)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-[17px] font-bold">Categories</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-accent-ink text-[14px] font-semibold"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tree.flatMap(({ category, children }) => [
          { c: category, depth: 0, hasChildren: children.length > 0 },
          ...children.map((child) => ({ c: child, depth: 1, hasChildren: false })),
        ]).map(({ c, depth, hasChildren }) => (
          <motion.div
            key={c.id}
            layout
            className={`flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 h-14 ${depth ? 'ml-6' : ''}`}
          >
            <span className="text-xl">{c.icon}</span>
            <span className="text-white text-[15px] flex-1 truncate">{c.name}</span>
            <button
              type="button"
              onClick={() => setEditingCategory(c)}
              className="text-secondary text-[13px] font-medium px-2"
            >
              Edit
            </button>
            {hasChildren ? (
              <span className="text-tertiary text-[12px] px-2">has sub-categories</span>
            ) : (
              <button
                type="button"
                onClick={() => categoryRepo.remove(c.id)}
                className="text-danger text-[13px] font-medium px-2"
              >
                Delete
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <NewCategorySheet open={creating} onClose={() => setCreating(false)} onCreated={() => setCreating(false)} parents={parents} />
      <NewCategorySheet
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        onCreated={() => setEditingCategory(null)}
        initial={editingCategory ?? undefined}
        parents={editingCategory?.parentId || parents.length ? parents : undefined}
      />
    </div>
  )
}
