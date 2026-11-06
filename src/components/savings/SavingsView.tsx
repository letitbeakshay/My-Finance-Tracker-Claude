import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Pencil, Plus } from 'lucide-react'
import { Card } from '../ui/Card'
import { SavingsPlanSheet } from './SavingsPlanSheet'
import { useExpenses, usePaymentAccounts, useSavingsPlans } from '../../hooks/useLiveData'
import { formatCurrency } from '../../lib/currency'
import { kindMeta, planProgress, planWhere } from '../../lib/savings'
import { VERSES } from '../../lib/scripture'
import type { SavingsPlan } from '../../types'

const GREEN = 'var(--color-savings)'

function Meter({ pct }: { pct: number }) {
  return (
    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: GREEN }} />
    </div>
  )
}

/** Your savings plans: how much is in each, where it is kept, and how close you are to the target. */
export function SavingsView({ month }: { month: Date }) {
  const plans = useSavingsPlans()
  const expenses = useExpenses()
  const accounts = usePaymentAccounts()
  const [editing, setEditing] = useState<SavingsPlan | null>(null)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const accountLabel = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a.label])), [accounts])
  const rows = useMemo(
    () => (plans ?? []).map((plan) => ({ plan, p: planProgress(plan, expenses ?? [], month) })),
    [plans, expenses, month],
  )
  if (!plans || !expenses) return null

  const open = rows.find((r) => r.plan.id === openId)
  const total = rows.reduce((s, r) => s + r.p.saved, 0)
  const targetTotal = rows.reduce((s, r) => s + (r.plan.target ?? 0), 0)
  const monthTotal = rows.reduce((s, r) => s + r.p.thisMonth, 0)
  const plannedMonthly = rows.reduce((s, r) => s + (r.plan.monthly ?? 0), 0)
  // Savings entered without choosing a plan.
  const unmapped = expenses.filter((e) => e.type === 'savings' && !e.savingsPlanId)

  if (open) {
    const { plan, p } = open
    return (
      <div className="max-w-[820px]">
        <button type="button" onClick={() => setOpenId(null)} className="h-11 pl-2 pr-4 -ml-2 mb-3 rounded-xl flex items-center gap-1 text-secondary text-[15px] font-medium">
          <ChevronLeft size={20} /> Back to savings
        </button>
        <Card>
          <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">{kindMeta(plan.kind).icon} {kindMeta(plan.kind).label}</p>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-white text-[22px] font-bold mt-0.5">{plan.name}</h2>
            <button type="button" onClick={() => setEditing(plan)} className="h-10 px-3.5 rounded-xl border border-border bg-surface text-white text-[14px] font-semibold flex items-center gap-1.5 shrink-0">
              <Pencil size={14} /> Edit
            </button>
          </div>
          <p className="text-white text-[34px] font-bold tabular-nums leading-none mt-3">
            {formatCurrency(p.saved)}
            {plan.target ? <span className="text-tertiary text-[16px] font-medium"> of {formatCurrency(plan.target)}</span> : null}
          </p>
          {p.pct !== null && (
            <>
              <div className="mt-4"><Meter pct={p.pct} /></div>
              <p className="text-tertiary text-[12px] mt-1.5 tabular-nums">
                {Math.round(p.pct)}% there · {formatCurrency(p.remaining ?? 0)} to go
              </p>
            </>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-5">
            <Fact label="Where it is kept" value={planWhere(plan, plan.accountId ? accountLabel.get(plan.accountId) : undefined) || 'Not set'} />
            <Fact label="Saved this month" value={formatCurrency(p.thisMonth)} />
            {plan.monthly ? <Fact label="Planned a month" value={formatCurrency(plan.monthly)} /> : null}
            {plan.interestRate != null ? <Fact label="Interest" value={`${plan.interestRate}% a year`} /> : null}
            {plan.maturityDate ? <Fact label="Matures" value={format(parseISO(plan.maturityDate), 'd MMM yyyy')} /> : null}
            {p.neededPerMonth ? <Fact label="Needed a month to reach it" value={formatCurrency(p.neededPerMonth)} /> : null}
            {plan.opening > 0 ? <Fact label="Already saved at start" value={formatCurrency(plan.opening)} /> : null}
          </div>
          {plan.notes && <p className="text-secondary text-[13px] mt-4">{plan.notes}</p>}
        </Card>

        <Card padded={false} className="mt-5 overflow-hidden">
          <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide px-5 pt-4 pb-2">
            {p.contributions.length} {p.contributions.length === 1 ? 'deposit' : 'deposits'}
          </p>
          {p.contributions.length === 0 ? (
            <p className="text-secondary text-[14px] text-center py-10 px-5">Nothing saved here yet. When you add an expense as Savings, choose this plan.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {p.contributions.map((e) => (
                <div key={e.id} className="px-5 py-3.5 flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-white text-[15px] font-medium truncate">{e.notes || 'Savings'}</span>
                    <span className="block text-tertiary text-[12px]">{format(parseISO(e.date), 'd MMM yyyy')}</span>
                  </span>
                  <span className="text-positive text-[15px] font-bold tabular-nums">+{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <SavingsPlanSheet open={!!editing} plan={editing} onClose={() => setEditing(null)} onSaved={(pl) => !pl && setOpenId(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <Card className="!p-6">
        <p className="text-tertiary text-[12px] font-semibold uppercase tracking-wide">Total saved</p>
        <p className="text-white text-[34px] font-bold tabular-nums leading-none mt-3">
          {formatCurrency(total)}
          {targetTotal > 0 && <span className="text-tertiary text-[16px] font-medium"> of {formatCurrency(targetTotal)}</span>}
        </p>
        {targetTotal > 0 && <div className="mt-4"><Meter pct={(total / targetTotal) * 100} /></div>}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <p className="text-tertiary text-[12px]">Saved this month</p>
            <p className="text-white text-[18px] font-bold tabular-nums mt-0.5">{formatCurrency(monthTotal)}</p>
          </div>
          <div>
            <p className="text-tertiary text-[12px]">Planned a month</p>
            <p className="text-white text-[18px] font-bold tabular-nums mt-0.5">{plannedMonthly ? formatCurrency(plannedMonthly) : '—'}</p>
          </div>
        </div>
        <p className="text-tertiary text-[12px] italic mt-5 leading-relaxed">“{VERSES.wiseSaves.text}” — {VERSES.wiseSaves.ref}</p>
      </Card>

      <Card padded={false}>
        <div className="flex items-center justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="text-white text-[18px] font-bold">Savings plans</h2>
            <p className="text-tertiary text-[12px]">FD, RD, SIP, emergency fund and more</p>
          </div>
          <button type="button" onClick={() => setAdding(true)} className="h-10 pl-3 pr-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold flex items-center gap-1.5 shrink-0">
            <Plus size={16} strokeWidth={2.6} /> New plan
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-secondary text-[14px] px-5 pb-8 leading-relaxed">
            No plans yet. Add one for each place you save (an emergency fund, an RD, a mutual fund SIP…), then choose it when you add an expense as Savings.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map(({ plan, p }) => (
              <button key={plan.id} type="button" onClick={() => setOpenId(plan.id)} className="w-full text-left px-5 py-4 flex items-center gap-3.5">
                <span className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-[20px] shrink-0">{kindMeta(plan.kind).icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-1 text-white text-[16px] font-medium min-w-0">
                      <span className="truncate">{plan.name}</span>
                      <ChevronRight size={15} className="text-tertiary shrink-0" />
                    </span>
                    <span className="text-white text-[16px] font-bold tabular-nums shrink-0">{formatCurrency(p.saved)}</span>
                  </span>
                  <span className="block text-tertiary text-[12px] truncate">
                    {kindMeta(plan.kind).label}
                    {planWhere(plan, plan.accountId ? accountLabel.get(plan.accountId) : undefined) ? ` · ${planWhere(plan, plan.accountId ? accountLabel.get(plan.accountId) : undefined)}` : ''}
                  </span>
                  {p.pct !== null && (
                    <span className="block mt-2">
                      <Meter pct={p.pct} />
                      <span className="flex justify-between text-[12px] mt-1.5 tabular-nums text-tertiary">
                        <span>{Math.round(p.pct)}% of {formatCurrency(plan.target!)}</span>
                        <span>{formatCurrency(p.thisMonth)} this month</span>
                      </span>
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {unmapped.length > 0 && (
        <p className="text-tertiary text-[12px] px-1">
          {unmapped.length} savings {unmapped.length === 1 ? 'expense is' : 'expenses are'} not linked to a plan ({formatCurrency(unmapped.reduce((s, e) => s + e.amount, 0))}). Open Expenses, pick one and choose its plan.
        </p>
      )}

      <SavingsPlanSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface border border-border px-3 py-2.5">
      <p className="text-tertiary text-[11px] font-medium">{label}</p>
      <p className="text-white text-[15px] font-semibold mt-0.5 break-words">{value}</p>
    </div>
  )
}
