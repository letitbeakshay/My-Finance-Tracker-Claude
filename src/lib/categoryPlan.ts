import type { Category, ExpenseType } from '../types'

interface PlanChild {
  name: string
  icon: string
  /** Existing categories with these names (any case) are reused instead of creating a new one. */
  matches?: string[]
  /** Only reuse an existing category of this name; never create it. */
  onlyIfExists?: boolean
}

interface PlanParent {
  name: string
  icon: string
  defaultType: ExpenseType
  reimbursable?: boolean
  matches?: string[]
  children?: PlanChild[]
}

/** The spending plan, in the order it appears on the Category screen. */
export const CATEGORY_PLAN: PlanParent[] = [
  {
    name: 'Family Support',
    icon: '🏠',
    defaultType: 'need',
    children: [
      { name: 'Amma', icon: '👩' },
      { name: 'Accha', icon: '👨' },
      { name: 'Grocery', icon: '🛒' },
      { name: 'Family expenses', icon: '👪' },
      { name: 'To Family', icon: '🏠', onlyIfExists: true },
    ],
  },
  {
    name: 'Eating Out',
    icon: '🍽️',
    defaultType: 'want',
    children: [
      { name: 'Coffee', icon: '☕' },
      { name: 'Outside Meal', icon: '🍛', matches: ['food'] },
      { name: 'Snacks', icon: '🥪' },
    ],
  },
  { name: 'Shopping', icon: '🛍', defaultType: 'want' },
  { name: 'Record (Reimbursable)', icon: '🧾', defaultType: 'need', reimbursable: true },
  {
    name: 'Helping Others',
    icon: '🤝',
    defaultType: 'giving',
    children: [{ name: 'Serving', icon: '🙌', onlyIfExists: true }],
  },
  {
    name: 'Giving',
    icon: '🤲',
    defaultType: 'giving',
    children: [
      { name: 'Tithe', icon: '🙏' },
      { name: 'Offering', icon: '🕊️' },
      { name: 'Missions', icon: '🌍' },
    ],
  },
  { name: 'Fuel', icon: '🛵', defaultType: 'need' },
  { name: 'Recharge', icon: '📱', defaultType: 'need' },
  {
    name: 'Savings',
    icon: '💰',
    defaultType: 'savings',
    children: [{ name: 'Investment', icon: '💰' }],
  },
  {
    name: 'Other Expenses',
    icon: '📦',
    defaultType: 'need',
    matches: ['others'],
    children: [
      { name: 'Medical', icon: '💊' },
      { name: 'Travel', icon: '✈️' },
      { name: 'Rent', icon: '🏠' },
      { name: 'Bills', icon: '💡' },
      { name: 'EMI', icon: '🏦' },
      { name: 'Education', icon: '📚' },
      { name: 'Clothing', icon: '👕' },
      { name: 'Gift', icon: '🎁' },
      { name: 'Work', icon: '💼' },
      { name: 'Entertainment', icon: '🍿' },
    ],
  },
]

export interface CategoryChanges {
  name?: string
  parentId?: string | null
  reimbursable?: boolean
  defaultType?: ExpenseType
  sortOrder?: number
  archived?: boolean
}

export type PlanOp =
  | { kind: 'create'; id: string; name: string; icon: string; parentId: string | null; reimbursable: boolean; defaultType?: ExpenseType; sortOrder: number }
  | { kind: 'update'; id: string; name: string; changes: CategoryChanges }

export interface PlannedNode {
  name: string
  icon: string
  /** new = created, moved/renamed = an existing one changed, kept = already right */
  status: 'new' | 'moved' | 'renamed' | 'kept'
  children: PlannedNode[]
}

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Works out what to change so the existing categories match CATEGORY_PLAN. Nothing is ever deleted:
 * existing categories are reused (and moved or renamed), missing ones are created. Safe to re-run.
 */
export function planCategories(existing: Category[], newId: () => string) {
  const used = new Set<string>()
  const pool = [...existing].sort((a, b) => Number(!!a.archived) - Number(!!b.archived) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const find = (names: string[]) => {
    const wanted = names.map(norm)
    return pool.find((c) => !used.has(c.id) && wanted.includes(norm(c.name)))
  }

  const ops: PlanOp[] = []
  const tree: PlannedNode[] = []

  function reuse(
    ex: Category,
    target: { name: string; parentId: string | null; sortOrder: number; reimbursable?: boolean; defaultType?: ExpenseType },
  ): PlannedNode['status'] {
    used.add(ex.id)
    const changes: CategoryChanges = {}
    if (ex.name !== target.name) changes.name = target.name
    if ((ex.parentId ?? null) !== target.parentId) changes.parentId = target.parentId
    if ((ex.sortOrder ?? 0) !== target.sortOrder) changes.sortOrder = target.sortOrder
    if (target.reimbursable !== undefined && !!ex.reimbursable !== target.reimbursable) changes.reimbursable = target.reimbursable
    if (target.defaultType && ex.defaultType !== target.defaultType) changes.defaultType = target.defaultType
    if (ex.archived) changes.archived = false
    if (Object.keys(changes).length) ops.push({ kind: 'update', id: ex.id, name: target.name, changes })
    if (changes.name) return 'renamed'
    return changes.parentId !== undefined ? 'moved' : Object.keys(changes).length ? 'moved' : 'kept'
  }

  CATEGORY_PLAN.forEach((parent, i) => {
    const ex = find([parent.name, ...(parent.matches ?? [])])
    let parentId: string
    let status: PlannedNode['status']
    if (ex) {
      parentId = ex.id
      status = reuse(ex, { name: parent.name, parentId: null, sortOrder: i, reimbursable: !!parent.reimbursable, defaultType: parent.defaultType })
    } else {
      parentId = newId()
      status = 'new'
      ops.push({ kind: 'create', id: parentId, name: parent.name, icon: parent.icon, parentId: null, reimbursable: !!parent.reimbursable, defaultType: parent.defaultType, sortOrder: i })
    }
    const node: PlannedNode = { name: parent.name, icon: parent.icon, status, children: [] }

    ;(parent.children ?? []).forEach((child, j) => {
      const cex = find([child.name, ...(child.matches ?? [])])
      if (cex) {
        node.children.push({ name: child.name, icon: cex.icon, status: reuse(cex, { name: child.name, parentId, sortOrder: j }), children: [] })
      } else if (!child.onlyIfExists) {
        ops.push({ kind: 'create', id: newId(), name: child.name, icon: child.icon, parentId, reimbursable: false, sortOrder: j })
        node.children.push({ name: child.name, icon: child.icon, status: 'new', children: [] })
      }
    })
    tree.push(node)
  })

  // Anything else the user made stays as it is, just listed after the plan.
  pool
    .filter((c) => !used.has(c.id) && !c.archived)
    .forEach((c, k) => {
      const changes: CategoryChanges = {}
      if ((c.sortOrder ?? 0) !== 100 + k) changes.sortOrder = 100 + k
      if (c.parentId) changes.parentId = null
      if (Object.keys(changes).length) ops.push({ kind: 'update', id: c.id, name: c.name, changes })
      tree.push({ name: c.name, icon: c.icon, status: 'kept', children: [] })
    })

  return {
    ops,
    tree,
    stats: {
      created: ops.filter((o) => o.kind === 'create').length,
      changed: ops.filter((o) => o.kind === 'update').length,
      renamed: ops.filter((o) => o.kind === 'update' && o.changes.name).length,
    },
  }
}
