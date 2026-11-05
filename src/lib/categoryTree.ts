import type { Category } from '../types'

export interface CategoryNode {
  category: Category
  children: Category[]
}

const bySort = (a: Category, b: Category) =>
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)

/** Top-level categories with their sub-categories. A sub-category whose parent is gone becomes top-level. */
export function buildTree(categories: Category[]): CategoryNode[] {
  const active = categories.filter((c) => !c.archived)
  const ids = new Set(active.map((c) => c.id))
  const isChild = (c: Category) => !!c.parentId && ids.has(c.parentId) && c.parentId !== c.id
  return active
    .filter((c) => !isChild(c))
    .sort(bySort)
    .map((category) => ({
      category,
      children: active.filter((c) => isChild(c) && c.parentId === category.id).sort(bySort),
    }))
}

/** id -> parent id (only for real sub-categories). */
export function parentMap(categories: Category[]) {
  const ids = new Set(categories.map((c) => c.id))
  const map = new Map<string, string>()
  for (const c of categories) if (c.parentId && ids.has(c.parentId) && c.parentId !== c.id) map.set(c.id, c.parentId)
  return map
}

/** The top-level category an id belongs to (itself, when it is top-level). */
export function topLevelId(id: string, parents: Map<string, string>) {
  return parents.get(id) ?? id
}

/** "Eating Out › Coffee" for a sub-category, plain name otherwise. */
export function categoryPath(category: Category | undefined, all: Map<string, Category>) {
  if (!category) return 'Others'
  const parent = category.parentId ? all.get(category.parentId) : undefined
  return parent ? `${parent.name} › ${category.name}` : category.name
}

/** The type to suggest for a category: its own, or its parent's. */
export function suggestedType(category: Category | undefined, all: Map<string, Category>) {
  if (!category) return undefined
  return category.defaultType ?? (category.parentId ? all.get(category.parentId)?.defaultType : undefined)
}
