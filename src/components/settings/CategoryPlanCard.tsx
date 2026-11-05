import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BottomSheet } from '../ui/BottomSheet'
import { useAllCategories } from '../../hooks/useLiveData'
import { categoryPlanRepo, dataRepo } from '../../db/repository'
import { planCategories, type PlannedNode } from '../../lib/categoryPlan'
import { downloadFile } from '../../lib/download'

const BADGE: Record<PlannedNode['status'], { label: string; className: string } | null> = {
  new: { label: 'New', className: 'bg-accent-soft text-accent-ink' },
  moved: { label: 'Moved', className: 'bg-surface text-secondary' },
  renamed: { label: 'Renamed', className: 'bg-surface text-secondary' },
  kept: null,
}

function Line({ node, depth }: { node: PlannedNode; depth: number }) {
  const badge = BADGE[node.status]
  return (
    <>
      <div className={`flex items-center gap-2.5 py-1.5 ${depth ? 'ml-7' : ''}`}>
        <span className="text-[17px] w-6 text-center">{node.icon}</span>
        <span className={`text-[14px] flex-1 truncate ${depth ? 'text-secondary' : 'text-white font-medium'}`}>{node.name}</span>
        {badge && <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${badge.className}`}>{badge.label}</span>}
      </div>
      {node.children.map((child) => (
        <Line key={child.name} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

/** One tap to organise your categories the way you spend. Nothing is deleted; a backup is saved first. */
export function CategoryPlanCard() {
  const categories = useAllCategories()
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const plan = useMemo(() => planCategories(categories ?? [], () => 'preview'), [categories])
  const nothingToDo = plan.ops.length === 0

  async function openSheet() {
    setOpen(true)
    setDone(false)
    setError('')
    setReady(null)
    setReady(await categoryPlanRepo.isReady())
  }

  async function apply() {
    setBusy(true)
    setError('')
    try {
      // A backup file is saved first, so this can always be undone.
      downloadFile(await dataRepo.exportJSON(), `backup-before-categories-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`, 'application/json')
      await categoryPlanRepo.apply(categories ?? [])
      setDone(true)
    } catch {
      setError('Something went wrong. Nothing was deleted, and it is safe to try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-3">Category plan</h3>
      <Card>
        <p className="text-secondary text-[14px] leading-relaxed mb-4">
          Family Support, Eating Out (Coffee, Outside Meal, Snacks), Shopping, Record (reimbursable), Helping
          Others, Fuel, Recharge, Savings and Other Expenses. Your current categories and expenses are kept.
        </p>
        <Button variant="secondary" onClick={openSheet}>
          Review my category plan
        </Button>
      </Card>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-white text-[20px] font-bold mb-1">Your category plan</h2>

        {done ? (
          <>
            <p className="text-positive text-[15px] font-medium my-4">Done. Your categories are organised.</p>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </>
        ) : (
          <>
            <p className="text-secondary text-[14px] mb-4">
              {nothingToDo
                ? 'Your categories already match the plan.'
                : `${plan.stats.created} new, ${plan.stats.changed} existing moved or renamed. Nothing is deleted, and a backup file is saved first.`}
            </p>
            {ready === false && (
              <p className="text-[13px] leading-relaxed rounded-2xl bg-accent-soft text-accent-ink px-4 py-3 mb-4">
                One small database update is needed first: use <span className="font-semibold">Copy the SQL</span> in the box at the top of the app,
                run it in Supabase (it only adds things and keeps all your data), then come back and press the button.
              </p>
            )}
            <div className="max-h-[42dvh] overflow-y-auto -mx-1 px-1 mb-5">
              {plan.tree.map((node) => (
                <Line key={node.name} node={node} depth={0} />
              ))}
            </div>
            {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Not now
              </Button>
              <Button onClick={apply} disabled={busy || nothingToDo || ready !== true}>
                {busy ? 'Working…' : 'Set up my categories'}
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
