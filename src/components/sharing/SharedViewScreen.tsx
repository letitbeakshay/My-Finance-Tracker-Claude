import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Eye, Loader2 } from 'lucide-react'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
import { MonthNav } from '../ui/MonthNav'
import { EmojiIcon } from '../ui/EmojiIcon'
import { monthKey } from '../../lib/planMonth'
import { formatIn, sharing, type SharedFull, type SharedSummary } from '../../lib/sharing'

interface Props {
  person: { id: string; name: string }
  onBack: () => void
}

/** Someone else's money, read-only: a couple partner's or the person you are accountability partner for. */
export function SharedViewScreen({ person, onBack }: Props) {
  const [month, setMonth] = useState(() => new Date())
  const [summary, setSummary] = useState<SharedSummary | null>(null)
  const [full, setFull] = useState<SharedFull | null>(null)
  const [error, setError] = useState('')
  const key = monthKey(month)

  useEffect(() => {
    let live = true
    setError('')
    sharing
      .summary(person.id, key)
      .then((s) => {
        if (!live) return
        setSummary(s)
        if (s.level === 'full' && !full) sharing.full(person.id).then((f) => live && setFull(f)).catch(() => undefined)
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not load this.'))
    return () => {
      live = false
    }
    // `full` is loaded once; it covers the last 13 months.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person.id, key])

  const cur = summary?.currency
  const money = (n: number) => formatIn(cur, Number(n) || 0)
  const income = Number(summary?.income ?? 0)
  const spent = Number(summary?.spent ?? 0)
  const given = Number(summary?.by_type.giving ?? 0)
  const saved = Number(summary?.by_type.savings ?? 0)
  const topCat = Math.max(1, ...(summary?.categories ?? []).map((c) => Number(c.total)))

  const monthExpenses = useMemo(() => (full?.expenses ?? []).filter((e) => e.date.startsWith(key)), [full, key])
  const catName = useMemo(() => new Map((full?.categories ?? []).map((c) => [c.id, c])), [full])
  const accountName = useMemo(() => new Map((full?.payment_accounts ?? []).map((a) => [a.id, a.label])), [full])

  return (
    <div className="px-6 pt-3 pb-10 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="fp-chip w-11 h-11 text-white active:scale-95 transition-transform duration-[var(--duration-quick)]"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold truncate">{person.name}’s money</h1>
          <p className="text-tertiary text-[13px] flex items-center gap-1.5">
            <Eye size={14} /> Read-only
          </p>
        </div>
      </div>
      <div className="mb-4">
        <MonthNav month={month} onChange={setMonth} className="text-[19px] font-bold min-w-[150px] text-center" />
      </div>

      {error && <p className="text-danger text-[15px]">{error}</p>}
      {!summary && !error && (
        <div className="flex items-center justify-center py-16 text-secondary">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {summary && (
        <div className="flex flex-col gap-4">
          <div className="hero rounded-card p-5">
            <p className="text-[14px]" style={{ color: 'rgba(255,255,255,.85)' }}>Spent in {format(month, 'MMMM')}</p>
            <p className="font-display font-medium text-[40px] tracking-tight leading-tight" style={{ color: '#fff' }}>{money(spent)}</p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                ['Income', income],
                ['Given', given],
                ['Saved', saved],
              ].map(([label, v]) => (
                <div key={label as string}>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.75)' }}>{label}</p>
                  <p className="text-[16px] font-semibold" style={{ color: '#fff' }}>{money(v as number)}</p>
                </div>
              ))}
            </div>
            {income > 0 && (
              <p className="text-[13px] mt-3" style={{ color: 'rgba(255,255,255,.85)' }}>
                Left this month: <b style={{ color: '#fff' }}>{money(income - spent)}</b>
              </p>
            )}
          </div>

          <Card>
            <h3 className="text-[17px] font-bold mb-3">Where it went</h3>
            {summary.categories.length === 0 && <p className="text-tertiary text-[14px]">Nothing spent this month yet.</p>}
            <div className="flex flex-col gap-3">
              {summary.categories.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center gap-2 text-[15px]">
                    <span className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-accent-ink shrink-0">
                      <EmojiIcon emoji={c.icon} name={c.name} size={16} />
                    </span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <b>{money(c.total)}</b>
                  </div>
                  <Progress value={(Number(c.total) / topCat) * 100} className="mt-2" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-[17px] font-bold mb-3">{format(month, 'MMMM')} plan</h3>
            {summary.plan.length === 0 && <p className="text-tertiary text-[14px]">No plan for this month.</p>}
            <div className="flex flex-col gap-3">
              {summary.plan.map((p) => {
                const pct = Number(p.amount) > 0 ? (Number(p.spent) / Number(p.amount)) * 100 : 0
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-[15px]">
                      <span className="font-medium">{p.name}</span>
                      <span>
                        <b>{money(p.spent)}</b> <span className="text-tertiary">of {money(p.amount)}</span>
                      </span>
                    </div>
                    <Progress value={Math.min(100, pct)} indicatorColor={pct > 100 ? 'var(--color-danger)' : undefined} className="mt-2" />
                  </div>
                )
              })}
            </div>
          </Card>

          {summary.level === 'full' && full && (
            <>
              <Card>
                <h3 className="text-[17px] font-bold mb-2">Transactions</h3>
                {monthExpenses.length === 0 && <p className="text-tertiary text-[14px]">No expenses this month.</p>}
                <div className="flex flex-col">
                  {monthExpenses.map((e) => {
                    const c = catName.get(e.category_id)
                    return (
                      <div key={e.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                        <span className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-accent-ink shrink-0">
                          <EmojiIcon emoji={c?.icon ?? ''} name={c?.name} size={16} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium truncate">{c?.name ?? 'Expense'}</p>
                          <p className="text-tertiary text-[13px] truncate">
                            {format(parseISO(e.date), 'd MMM')}
                            {e.account_id && accountName.get(e.account_id) ? ` · ${accountName.get(e.account_id)}` : ''}
                            {e.notes ? ` · ${e.notes}` : ''}
                          </p>
                        </div>
                        <b className="text-[15px]">{money(-e.amount)}</b>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {full.loans.filter((l) => !l.closed).length > 0 && (
                <Card>
                  <h3 className="text-[17px] font-bold mb-3">Loans</h3>
                  <div className="flex flex-col gap-3">
                    {full.loans
                      .filter((l) => !l.closed)
                      .map((l) => {
                        const left = Math.max(0, Number(l.principal) - Number(l.paid))
                        return (
                          <div key={l.id}>
                            <div className="flex justify-between text-[15px]">
                              <span className="font-medium">{l.name}</span>
                              <span>
                                <b>{money(left)}</b> <span className="text-tertiary">{l.kind === 'lent' ? 'to get back' : 'left'}</span>
                              </span>
                            </div>
                            <Progress value={Number(l.principal) > 0 ? (Number(l.paid) / Number(l.principal)) * 100 : 0} className="mt-2" />
                          </div>
                        )
                      })}
                  </div>
                </Card>
              )}

              {full.savings_plans.filter((s) => !s.closed).length > 0 && (
                <Card>
                  <h3 className="text-[17px] font-bold mb-3">Savings goals</h3>
                  <div className="flex flex-col gap-2">
                    {full.savings_plans
                      .filter((s) => !s.closed)
                      .map((s) => (
                        <div key={s.id} className="flex justify-between text-[15px]">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-secondary">{s.target ? `Goal ${money(s.target)}` : s.monthly ? `${money(s.monthly)} a month` : ''}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </>
          )}

          <p className="text-tertiary text-[13px] text-center">You can look, but not change anything. {person.name} can stop sharing at any time.</p>
        </div>
      )}
    </div>
  )
}
