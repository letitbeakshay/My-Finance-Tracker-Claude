import { useEffect, useMemo, useState } from 'react'
import { Reorder } from 'framer-motion'
import clsx from 'clsx'
import { ChevronDown, GripVertical, Search, X } from 'lucide-react'
import type { Category } from '../../types'
import { Chip } from '../ui/Chip'
import { NewCategorySheet } from '../settings/NewCategorySheet'
import { categoryRepo } from '../../db/repository'
import { BUDGET_STATUS_COLOR, type BudgetLine } from '../../lib/budgets'
import { BudgetImpact } from '../budget/BudgetImpact'
import { buildTree, categoryPath } from '../../lib/categoryTree'
import { formatCurrency } from '../../lib/currency'

interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
  /** `cards` is the step-by-step screen: top-level cards that open to show what is below them. */
  variant?: 'chips' | 'cards'
  /** This month's budget progress by category id (cards variant). */
  budgetLines?: Map<string, BudgetLine>
  /** The amount being added, so each budget can show what it would look like afterwards. */
  amount?: number
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  variant = 'chips',
  budgetLines,
  amount = 0,
}: CategoryPickerProps) {
  const [creating, setCreating] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [query, setQuery] = useState('')
  const tree = useMemo(() => buildTree(categories), [categories])
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const [order, setOrder] = useState(tree.map((n) => n.category))
  // The top-level category that is open: the one holding the chosen sub-category, until you tap another.
  const [openId, setOpenId] = useState<string | null>(null)
  const selectedParentId = value ? byId.get(value)?.parentId ?? null : null
  const effectiveOpen = openId ?? selectedParentId

  useEffect(() => {
    if (!reordering) setOrder(tree.map((n) => n.category))
  }, [tree, reordering])

  // Search: every word you type must appear in a category's name (or its parent's). Best matches first.
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const searching = tokens.length > 0
  const visible = useMemo(() => {
    const hit = (text: string) => tokens.every((t) => text.toLowerCase().includes(t))
    if (!searching) return tree.map((n, order) => ({ ...n, shown: n.children, parentHit: true, rank: 0, order }))
    return tree
      .flatMap((n, order) => {
        const parentHit = hit(n.category.name)
        const kids = n.children.filter((c) => hit(`${c.name} ${n.category.name}`))
        if (!parentHit && kids.length === 0) return []
        const startsWith = n.category.name.toLowerCase().startsWith(tokens[0])
        return [{ ...n, shown: parentHit ? n.children : kids, parentHit, rank: parentHit ? (startsWith ? 0 : 1) : 2, order }]
      })
      .sort((a, b) => a.rank - b.rank || a.order - b.order)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, query])

  async function handleDone() {
    setReordering(false)
    await categoryRepo.reorder(order.map((c) => c.id))
  }

  const header = (
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
  )

  const sheet = (
    <NewCategorySheet
      open={creating}
      defaultName={query.trim()}
      onClose={() => setCreating(false)}
      onCreated={(category) => {
        setCreating(false)
        setQuery('')
        onChange(category.id)
      }}
    />
  )

  if (reordering) {
    return (
      <>
        {header}
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
        {sheet}
      </>
    )
  }

  if (variant === 'chips') {
    // Edit form: every category on one screen, sub-categories labelled with their parent.
    const flat = tree.flatMap((n) => (n.children.length ? n.children : [n.category]))
    return (
      <>
        {header}
        <div className="flex flex-wrap gap-2">
          {flat.map((c) => (
            <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)} className="h-10 px-3.5 text-[14px]">
              <span>{c.icon}</span>
              <span>{categoryPath(c, byId)}</span>
            </Chip>
          ))}
          <Chip onClick={() => setCreating(true)} className="h-10 px-3.5 text-[14px]">
            <span>＋</span>
            <span>New</span>
          </Chip>
        </div>
        {sheet}
      </>
    )
  }

  return (
    <>
      {header}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories"
          aria-label="Search categories"
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="search"
          className="w-full h-12 bg-surface border border-border rounded-2xl pl-11 pr-11 text-white text-[16px] placeholder:text-tertiary"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-tertiary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {searching && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
          <p className="text-secondary text-[14px] mb-3">No category matches “{query.trim()}”.</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="h-11 px-5 rounded-xl bg-primary text-on-primary text-[14px] font-semibold"
          >
            Create “{query.trim()}”
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {visible.map(({ category, children, shown, parentHit }) => {
          const line = budgetLines?.get(category.id)
          const hasChildren = children.length > 0
          const isOpen = searching ? hasChildren : effectiveOpen === category.id
          const chosenChild = children.find((c) => c.id === value)
          const selected = value === category.id || !!chosenChild
          return (
            <div
              key={category.id}
              className={clsx(
                'rounded-2xl border transition-colors',
                selected ? 'bg-accent-soft border-accent' : 'bg-card border-border',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (!hasChildren) {
                    onChange(category.id)
                    setQuery('')
                  } else if (!searching) setOpenId(isOpen ? '' : category.id)
                }}
                aria-expanded={hasChildren ? isOpen : undefined}
                className="w-full text-left p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-[18px] shrink-0">
                    {category.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={clsx('block font-medium text-[15px] truncate', selected ? 'text-accent-ink' : 'text-white')}>
                      {category.name}
                    </span>
                    {chosenChild && (
                      <span className="block text-secondary text-[12px] truncate">{chosenChild.name}</span>
                    )}
                  </span>
                  {line && (
                    <span className="text-[13px] font-semibold tabular-nums shrink-0" style={{ color: BUDGET_STATUS_COLOR[line.status] }}>
                      {line.pct}% used
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown size={18} className={clsx('text-tertiary shrink-0 transition-transform', isOpen && 'rotate-180')} />
                  )}
                </div>
                {line && <BudgetImpact line={line} amount={amount} />}
              </button>

              {hasChildren && isOpen && (
                <div className="px-3.5 pb-3.5 -mt-0.5">
                  <p className="text-tertiary text-[12px] mb-2">What kind?</p>
                  <div className="flex flex-wrap gap-2">
                    {shown.map((c) => (
                      <Chip
                        key={c.id}
                        selected={value === c.id}
                        onClick={() => {
                          onChange(c.id)
                          setQuery('')
                        }}
                        className="h-10 px-3.5 text-[14px]"
                      >
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                        {budgetLines?.get(c.id) && (
                          <span className="text-[11px] font-semibold" style={{ color: BUDGET_STATUS_COLOR[budgetLines.get(c.id)!.status] }}>
                            {budgetLines.get(c.id)!.remaining >= 0 ? `${formatCurrency(budgetLines.get(c.id)!.remaining)} left` : 'over'}
                          </span>
                        )}
                      </Chip>
                    ))}
                    {parentHit && (
                      <Chip
                        selected={value === category.id}
                        onClick={() => {
                          onChange(category.id)
                          setQuery('')
                        }}
                        className="h-10 px-3.5 text-[14px]"
                      >
                        <span>General</span>
                      </Chip>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {!searching && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-2xl border border-dashed border-border px-3.5 h-14 flex items-center gap-2.5 text-[15px] font-medium text-secondary"
          >
            <span className="text-[18px]">＋</span>
            <span>New category</span>
          </button>
        )}
      </div>
      {sheet}
    </>
  )
}
