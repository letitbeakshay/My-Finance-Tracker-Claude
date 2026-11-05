import { useEffect, useMemo, useState } from 'react'
import { Reorder } from 'framer-motion'
import clsx from 'clsx'
import { ChevronDown, GripVertical } from 'lucide-react'
import type { Category } from '../../types'
import { Chip } from '../ui/Chip'
import { NewCategorySheet } from '../settings/NewCategorySheet'
import { categoryRepo } from '../../db/repository'
import { BUDGET_STATUS_COLOR, type BudgetLine } from '../../lib/budgets'
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

/** How a budget looks if `amount` is added to it. */
function afterAdding(line: BudgetLine, amount: number) {
  const usedPct = Math.min(100, (line.spent / line.limit) * 100)
  const addPct = Math.min(100 - usedPct, (amount / line.limit) * 100)
  const after = line.remaining - amount
  const status = after < 0 ? 'over' : (line.spent + amount) / line.limit >= 0.8 ? 'warning' : 'ok'
  return { usedPct, addPct, after, status } as const
}

function BudgetMeter({ line, amount }: { line: BudgetLine; amount: number }) {
  const { usedPct, addPct, after, status } = afterAdding(line, amount)
  const nowColor = BUDGET_STATUS_COLOR[line.status]
  const afterColor = BUDGET_STATUS_COLOR[status]
  return (
    <>
      <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div className="h-full" style={{ width: `${usedPct}%`, background: nowColor }} />
        <div className="h-full" style={{ width: `${addPct}%`, background: afterColor, opacity: 0.45 }} />
      </div>
      <p className="mt-2 text-[12px] tabular-nums" style={{ color: status === 'ok' ? 'var(--color-tertiary)' : afterColor }}>
        {formatCurrency(line.spent)} of {formatCurrency(line.limit)} used ·{' '}
        {after >= 0 ? `${formatCurrency(after)} left after this` : `${formatCurrency(-after)} over with this`}
      </p>
    </>
  )
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
      onClose={() => setCreating(false)}
      onCreated={(category) => {
        setCreating(false)
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
      <div className="flex flex-col gap-2.5">
        {tree.map(({ category, children }) => {
          const line = budgetLines?.get(category.id)
          const hasChildren = children.length > 0
          const isOpen = effectiveOpen === category.id
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
                onClick={() => (hasChildren ? setOpenId(isOpen ? '' : category.id) : onChange(category.id))}
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
                {line && <BudgetMeter line={line} amount={amount} />}
              </button>

              {hasChildren && isOpen && (
                <div className="px-3.5 pb-3.5 -mt-0.5">
                  <p className="text-tertiary text-[12px] mb-2">What kind?</p>
                  <div className="flex flex-wrap gap-2">
                    {children.map((c) => (
                      <Chip key={c.id} selected={value === c.id} onClick={() => onChange(c.id)} className="h-10 px-3.5 text-[14px]">
                        <span>{c.icon}</span>
                        <span>{c.name}</span>
                      </Chip>
                    ))}
                    <Chip selected={value === category.id} onClick={() => onChange(category.id)} className="h-10 px-3.5 text-[14px]">
                      <span>General</span>
                    </Chip>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-2xl border border-dashed border-border px-3.5 h-14 flex items-center gap-2.5 text-[15px] font-medium text-secondary"
        >
          <span className="text-[18px]">＋</span>
          <span>New category</span>
        </button>
      </div>
      {sheet}
    </>
  )
}
