import { useMemo, useState } from 'react'
import { addMonths, differenceInCalendarDays, format, isSameMonth, parseISO, setDate, startOfDay, subDays } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  FileUp,
  Landmark,
  Plus,
  Share2,
  TrendingDown,
  TrendingUp,
  Info,
  WalletCards,
} from 'lucide-react'
import { Card } from '../ui/card'
import { Money } from '../ui/Money'
import { formatCurrency, formatCurrencyCompact } from '../../lib/currency'
import { loanStats } from '../../lib/loanMath'
import { DURATION, EASE_SMOOTH_OUT } from '../../lib/motion'
import type { TrendPoint } from '../../lib/trend'
import type { TransactionRow } from './TransactionsPanel'
import type { AccountSummary } from './AccountsPanel'
import type { Expense, Loan } from '../../types'

/* ------------------------------------------------------------------------------------------------
 * The Dashboard overview: a calm, airy layout. One headline number with quick actions, small income
 * and spending cards, an activity chart, what is due soon, and the most-used credit card as a card.
 * ---------------------------------------------------------------------------------------------- */

interface Props {
  month: Date
  totalIncome: number
  totalExpenses: number
  incomeTrend: TrendPoint[]
  expenseTrend: TrendPoint[]
  /** Your own spending (reimbursable left out), all months, for the activity chart. */
  expenses: Expense[]
  rows: TransactionRow[]
  loans: Loan[]
  accountSummaries: AccountSummary[]
  onSelectRow: (key: string) => void
  onViewTransactions: () => void
  onViewLoans: () => void
  onOpenBudgets: () => void
  onSelectLoan: (loan: Loan) => void
  onAddExpense: () => void
  onAddIncome: () => void
  onAddLoan: () => void
  onImport: () => void
  onReport: () => void
  /** First fruits and budget cards, rendered in the middle column. */
  giving?: React.ReactNode
}

const pctChange = (points: TrendPoint[]) => {
  const cur = points.at(-1)?.value ?? 0
  const prev = points.at(-2)?.value ?? 0
  return prev > 0 ? ((cur - prev) / prev) * 100 : null
}

function ChangePill({ pct, goodWhenUp }: { pct: number | null; goodWhenUp: boolean }) {
  if (pct == null || !isFinite(pct) || Math.abs(pct) > 300) return null
  const up = pct >= 0
  const good = up === goodWhenUp
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums',
        good ? 'bg-positive/12 text-positive' : 'bg-danger/12 text-danger',
      )}
    >
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="text-white text-[16px] font-semibold">{children}</h3>
      {action}
    </div>
  )
}

function ViewAll({ onClick, label = 'View all' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-accent-ink rounded-full px-2.5 h-8 hover:bg-accent-soft transition-colors duration-[var(--duration-quick)]"
    >
      {label} <ChevronRight size={15} />
    </button>
  )
}

/* ---------------- Headline card with quick actions ---------------- */

function BalanceCard({ totalIncome, totalExpenses, onAddExpense, onAddIncome, onAddLoan, onImport, onReport, onViewTransactions, onOpenBudgets }: Pick<Props, 'totalIncome' | 'totalExpenses' | 'onAddExpense' | 'onAddIncome' | 'onAddLoan' | 'onImport' | 'onReport' | 'onViewTransactions' | 'onOpenBudgets'>) {
  const [hidden, setHidden] = useState(false)
  const left = totalIncome - totalExpenses
  const actions = [
    { label: 'Expense', icon: Plus, onClick: onAddExpense, primary: true },
    { label: 'Income', icon: ArrowDownLeft, onClick: onAddIncome },
    { label: 'Loan', icon: Landmark, onClick: onAddLoan },
    { label: 'Import', icon: FileUp, onClick: onImport },
    { label: 'Report', icon: Share2, onClick: onReport },
  ]
  return (
    <Card className="justify-between gap-7 !p-6">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-secondary text-[14px] flex items-center gap-2.5">
            <span className="fp-chip w-9 h-9">
              <WalletCards size={16} strokeWidth={1.6} />
            </span>
            Spent this month
          </p>
          <button
            type="button"
            onClick={onViewTransactions}
            aria-label="See this month's transactions"
            className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center transition-transform duration-[var(--duration-quick)] ease-smooth-out hover:scale-105 active:scale-95"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div
            className={clsx('transition-[filter] duration-[var(--duration-fast)] ease-smooth-out', hidden && 'blur-md select-none')}
            aria-hidden={hidden}
          >
            <Money value={totalExpenses} className="font-display font-medium text-[42px] sm:text-[48px] leading-none tracking-[-0.035em]" />
          </div>
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
            className="w-8 h-8 rounded-full flex items-center justify-center text-tertiary hover:text-white hover:bg-surface transition-colors duration-[var(--duration-quick)]"
          >
            {hidden ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenBudgets}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 pl-2.5 pr-2 py-1 text-[12.5px] text-secondary hover:bg-card transition-colors duration-[var(--duration-quick)]"
        >
          <Info size={13} strokeWidth={1.8} className="text-tertiary" />
          {totalIncome > 0 ? (
            <>
              {left < 0 ? 'Over income' : 'Left from income'} ·
              <b className={clsx('tabular-nums font-semibold', left < 0 ? 'text-danger' : 'text-white')}>{hidden ? '•••' : formatCurrency(Math.abs(left))}</b>
            </>
          ) : (
            'No income recorded this month'
          )}
          <ChevronRight size={14} className="text-tertiary" />
        </button>
      </div>
      <div>
        <p className="text-secondary text-[13px] mb-3">Quick actions</p>
        <div className="grid grid-cols-5 gap-2">
          {actions.map(({ label, icon: Icon, onClick, primary }) => (
            <button key={label} type="button" onClick={onClick} className="group flex flex-col items-center gap-2">
              <span
                className={clsx(
                  'w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center transition-transform duration-[var(--duration-quick)] ease-smooth-out group-hover:-translate-y-0.5 group-active:scale-95',
                  primary ? 'fp-gradient text-white shadow-[0_10px_24px_-10px_rgba(47,91,56,.7)]' : 'fp-chip text-white',
                )}
              >
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <span className="text-[12px] text-secondary">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

/* ---------------- Small stat cards ---------------- */

function StatCard({ label, value, pct, goodWhenUp, icon: Icon, tone }: { label: string; value: number; pct: number | null; goodWhenUp: boolean; icon: typeof TrendingUp; tone: 'income' | 'expense' }) {
  return (
    <Card className="!p-5 justify-between gap-4">
      <div className="flex items-center justify-between">
        <p className="text-secondary text-[13px] font-medium">{label}</p>
        <span className={clsx('fp-chip w-9 h-9', tone === 'income' ? 'text-positive' : 'text-want')}>
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="flex items-end justify-between gap-2 flex-wrap">
        <p className="text-white font-display font-medium text-[26px] leading-none tracking-[-0.03em] tabular-nums">{formatCurrency(value)}</p>
        <ChangePill pct={pct} goodWhenUp={goodWhenUp} />
      </div>
      <p className="text-tertiary text-[12px] -mt-2">vs last month</p>
    </Card>
  )
}

/* ---------------- Activity chart ---------------- */

function ActivityCard({ expenses, month, expenseTrend, incomeTrend }: { expenses: Expense[]; month: Date; expenseTrend: TrendPoint[]; incomeTrend: TrendPoint[] }) {
  const [range, setRange] = useState<'week' | 'months'>('week')
  // The week ends today in the current month, or on the last day of a past month.
  const end = isSameMonth(month, new Date()) ? startOfDay(new Date()) : startOfDay(addMonths(setDate(month, 1), 1).getTime() - 1)
  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(end, 6 - i))
    const sum = (d: Date) => expenses.filter((e) => differenceInCalendarDays(parseISO(e.date), d) === 0).reduce((s, e) => s + e.amount, 0)
    const values = days.map((d) => ({ label: format(d, 'EEEEE'), full: format(d, 'EEE d MMM'), value: sum(d) }))
    const prev = Array.from({ length: 7 }, (_, i) => subDays(end, 13 - i)).reduce((s, d) => s + sum(d), 0)
    return { values, total: values.reduce((s, v) => s + v.value, 0), prev }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, end.getTime()])
  const bars: { label: string; full: string; value: number; income?: number }[] =
    range === 'week' ? week.values : expenseTrend.map((p, k) => ({ label: p.label, full: p.full, value: p.value, income: incomeTrend[k]?.value ?? 0 }))
  const total = range === 'week' ? week.total : expenseTrend.at(-1)?.value ?? 0
  const pct = range === 'week' ? (week.prev > 0 ? ((week.total - week.prev) / week.prev) * 100 : null) : pctChange(expenseTrend)
  const max = Math.max(1, ...bars.map((b) => b.value))
  const peak = bars.reduce((iMax, b, i, arr) => (b.value > arr[iMax].value ? i : iMax), 0)
  const [active, setActive] = useState<number | null>(null)
  const focus = active ?? (range === 'months' ? bars.length - 1 : peak)

  return (
    <Card className="!p-6 gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-secondary text-[13px] font-medium">Spending activity</p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-white font-display font-medium text-[32px] leading-none tracking-[-0.035em] tabular-nums">{formatCurrencyCompact(total)}</p>
            <ChangePill pct={pct} goodWhenUp={false} />
          </div>
          <p className="text-tertiary text-[12px] mt-1">{range === 'week' ? 'Last 7 days, vs the 7 before' : 'Spent this month, vs last month'}</p>
        </div>
        <div className="flex shrink-0 whitespace-nowrap rounded-full bg-surface p-1 text-[13px] font-semibold" role="tablist" aria-label="Activity range">
          {(['week', 'months'] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => {
                setRange(r)
                setActive(null)
              }}
              className={clsx('relative h-8 px-3.5 rounded-full transition-colors duration-[var(--duration-fast)]', range === r ? 'text-on-primary' : 'text-secondary')}
            >
              {range === r && (
                <motion.span layoutId="activity-range" className="absolute inset-0 rounded-full bg-primary" transition={{ duration: DURATION.fast, ease: EASE_SMOOTH_OUT }} />
              )}
              <span className="relative">{r === 'week' ? 'Week' : <><span className="sm:hidden">6M</span><span className="hidden sm:inline">6 months</span></>}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-2 sm:gap-3 h-[170px] pt-8" onMouseLeave={() => setActive(null)}>
        {bars.map((b, i) => (
          <button
            key={`${range}-${b.label}-${i}`}
            type="button"
            className="relative flex-1 h-full flex flex-col items-center justify-end gap-2 group"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`${b.full}: ${formatCurrency(b.value)}`}
          >
            <AnimatePresence>
              {focus === i && b.value > 0 && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }}
                  exit={{ opacity: 0, transition: { duration: 0.05 } }}
                  className={clsx(
                    'absolute -top-1 -translate-y-full whitespace-nowrap tabular-nums z-10 pointer-events-none',
                    b.income != null
                      ? 'rounded-2xl bg-card border border-border shadow-[0_10px_30px_-12px_rgba(20,40,25,.35)] px-3 py-2 text-left text-[11.5px] leading-[1.5]'
                      : 'rounded-full bg-primary text-on-primary text-[11px] font-semibold px-2 py-0.5',
                    b.income != null && i === 0 && 'left-0',
                    b.income != null && i === bars.length - 1 && 'right-0',
                  )}
                >
                  {b.income != null ? (
                    <>
                      <span className="flex justify-between gap-4 text-secondary">Income <b className="text-positive font-semibold">+{formatCurrencyCompact(b.income)}</b></span>
                      <span className="flex justify-between gap-4 text-secondary">Spent <b className="text-white font-semibold">−{formatCurrencyCompact(b.value)}</b></span>
                    </>
                  ) : (
                    formatCurrencyCompact(b.value)
                  )}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="w-full max-w-[44px] flex-1 flex items-end rounded-full bg-surface overflow-hidden">
              <motion.span
                className={clsx('w-full rounded-full', focus === i ? 'fp-gradient fp-stripes' : 'bg-accent/25')}
                initial={false}
                animate={{ height: `${Math.max(6, (b.value / max) * 100)}%` }}
                transition={{ duration: DURATION.slow, ease: EASE_SMOOTH_OUT }}
              />
            </span>
            <span className={clsx('text-[12px] font-medium', focus === i ? 'text-white' : 'text-tertiary')}>{b.label}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

/* ---------------- Upcoming payments ---------------- */

interface Due {
  key: string
  title: string
  sub: string
  amount: number
  date: Date
  icon: typeof Landmark
  loan?: Loan
}

function nextCardDue(dueDay: number) {
  const today = startOfDay(new Date())
  let d = setDate(today, Math.min(dueDay, 28))
  if (d < today) d = addMonths(d, 1)
  return d
}

function UpcomingCard({ loans, accountSummaries, onViewLoans, onSelectLoan }: Pick<Props, 'loans' | 'accountSummaries' | 'onViewLoans' | 'onSelectLoan'>) {
  const today = startOfDay(new Date())
  const items: Due[] = []
  for (const loan of loans) {
    if (loan.closed || loan.kind !== 'borrowed' || !loan.nextDueDate) continue
    const date = parseISO(loan.nextDueDate)
    const amount = loan.emi ?? loanStats(loan).emi
    if (differenceInCalendarDays(date, today) > 45) continue
    items.push({ key: `l:${loan.id}`, title: loan.name, sub: 'Loan EMI', amount, date, icon: Landmark, loan })
  }
  for (const s of accountSummaries) {
    if (s.account.type !== 'credit_card' || !s.account.dueDay || s.spent <= 0) continue
    items.push({ key: `c:${s.account.id}`, title: s.account.label, sub: 'Card bill', amount: s.spent, date: nextCardDue(s.account.dueDay), icon: CreditCard })
  }
  items.sort((a, b) => a.date.getTime() - b.date.getTime())
  const when = (d: Date) => {
    const n = differenceInCalendarDays(d, today)
    if (n < 0) return `${-n} day${n === -1 ? '' : 's'} overdue`
    if (n === 0) return 'Due today'
    if (n === 1) return 'Due tomorrow'
    return `Due in ${n} days`
  }
  return (
    <Card className="!p-6">
      <SectionTitle action={loans.length > 0 ? <ViewAll onClick={onViewLoans} /> : undefined}>Upcoming payments</SectionTitle>
      {items.length === 0 ? (
        <p className="text-secondary text-[14px] py-6 text-center">Nothing due in the next few weeks.</p>
      ) : (
        <div className="flex flex-col -mx-2">
          {items.slice(0, 5).map((it) => {
            const n = differenceInCalendarDays(it.date, today)
            const Icon = it.icon
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => (it.loan ? onSelectLoan(it.loan) : undefined)}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-surface/70 transition-colors duration-[var(--duration-quick)]"
              >
                <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                  <Icon size={17} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white text-[15px] font-medium truncate">{it.title}</span>
                  <span className="block text-tertiary text-[12px] truncate">{it.sub}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-white text-[15px] font-semibold tabular-nums">{formatCurrency(it.amount)}</span>
                  <span className={clsx('block text-[12px]', n < 0 ? 'text-danger' : n <= 3 ? 'text-warning' : 'text-tertiary')}>{when(it.date)}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}

/* ---------------- Credit card ---------------- */

function CreditCardVisual({ accountSummaries }: Pick<Props, 'accountSummaries'>) {
  const cards = accountSummaries.filter((s) => s.account.type === 'credit_card').sort((a, b) => b.spent - a.spent)
  const [i, setI] = useState(0)
  if (cards.length === 0) return null
  const s = cards[i % cards.length]
  const a = s.account
  const used = a.creditLimit ? Math.min(100, (s.spent / a.creditLimit) * 100) : null
  return (
    <Card className="!p-6 gap-4">
      <SectionTitle
        action={
          cards.length > 1 ? (
            <div className="flex gap-1.5" role="tablist" aria-label="Credit cards">
              {cards.map((c, k) => (
                <button
                  key={c.account.id}
                  type="button"
                  role="tab"
                  aria-selected={k === i % cards.length}
                  aria-label={c.account.label}
                  onClick={() => setI(k)}
                  className={clsx('h-2 rounded-full transition-all duration-[var(--duration-fast)] ease-smooth-out', k === i % cards.length ? 'w-6 bg-accent' : 'w-2 bg-border')}
                />
              ))}
            </div>
          ) : undefined
        }
      >
        Credit card
      </SectionTitle>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: 12, filter: 'blur(3px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: DURATION.fast, ease: EASE_SMOOTH_OUT } }}
          exit={{ opacity: 0, x: -12, filter: 'blur(3px)', transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }}
          className="fp-card relative aspect-[1.6/1] rounded-[22px] p-5 text-white overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div>
              {a.bankName && <p className="text-[13px] opacity-80">{a.bankName}</p>}
              <p className="text-[17px] font-semibold leading-tight">{a.label}</p>
            </div>
            <span className="fp-cardchip" aria-hidden />
          </div>
          <div>
            <p className="text-[12px] opacity-75">Spent this month</p>
            <p className="font-display font-medium text-[28px] leading-tight tracking-[-0.03em] tabular-nums">{formatCurrency(s.spent)}</p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="tracking-[0.2em] text-[14px] opacity-90 tabular-nums">•••• {a.last4 || '····'}</p>
            {a.creditLimit ? <p className="text-[12px] opacity-80 tabular-nums">Limit {formatCurrencyCompact(a.creditLimit)}</p> : null}
          </div>
        </motion.div>
      </AnimatePresence>
      {used != null && (
        <div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full fp-gradient transition-[width] duration-[var(--duration-slow)] ease-smooth-out"
              style={{ width: `${used}%`, ...(used > 80 ? { background: 'var(--color-danger)' } : {}) }}
            />
          </div>
          <p className="text-tertiary text-[12px] mt-1.5 tabular-nums">
            {Math.round(used)}% of limit used{a.dueDay ? ` · bill due on the ${a.dueDay}${ordinal(a.dueDay)}` : ''}
          </p>
        </div>
      )}
    </Card>
  )
}

function ordinal(n: number) {
  const r = n % 100
  if (r >= 11 && r <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10] ?? 'th'
}

/* ---------------- Recent transactions ---------------- */

function RecentCard({ rows, onSelectRow, onViewTransactions }: Pick<Props, 'rows' | 'onSelectRow' | 'onViewTransactions'>) {
  return (
    <Card className="!p-6">
      <SectionTitle action={rows.length > 0 ? <ViewAll onClick={onViewTransactions} /> : undefined}>Recent transactions</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-secondary text-[14px] py-6 text-center">Nothing recorded this month yet.</p>
      ) : (
        <div className="flex flex-col -mx-2">
          {rows.slice(0, 6).map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onSelectRow(r.key)}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-surface/70 transition-colors duration-[var(--duration-quick)]"
            >
              <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">{r.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-white text-[15px] font-medium truncate">{r.title}</span>
                <span className="block text-tertiary text-[12px] truncate">
                  {[format(parseISO(r.date), 'd MMM'), r.note].filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className={clsx('text-[15px] font-semibold tabular-nums shrink-0', r.kind === 'income' ? 'text-positive' : 'text-white')}>
                {r.kind === 'income' ? '+' : '−'}
                {formatCurrency(r.amount)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------------- Layout ---------------- */

export function DashboardOverview(props: Props) {
  return (
    <div className="grid gap-4 lg:gap-5 md:grid-cols-2 xl:grid-cols-12">
      <div className="md:col-span-2 xl:col-span-5 [&>*]:h-full">
        <BalanceCard {...props} />
      </div>
      <div className="grid gap-4 lg:gap-5 grid-cols-2 md:col-span-2 xl:col-span-3 xl:grid-cols-1">
        <StatCard label="Income" value={props.totalIncome} pct={pctChange(props.incomeTrend)} goodWhenUp icon={ArrowDownLeft} tone="income" />
        <StatCard label="Expenses" value={props.totalExpenses} pct={pctChange(props.expenseTrend)} goodWhenUp={false} icon={ArrowUpRight} tone="expense" />
      </div>
      <div className="md:col-span-2 xl:col-span-4 [&>*]:h-full">
        <UpcomingCard {...props} />
      </div>
      <div className="md:col-span-2 xl:col-span-8 [&>*]:h-full">
        <ActivityCard expenses={props.expenses} month={props.month} expenseTrend={props.expenseTrend} incomeTrend={props.incomeTrend} />
      </div>
      <div className="md:col-span-2 xl:col-span-4 [&>*]:h-full">
        <CreditCardVisual accountSummaries={props.accountSummaries} />
      </div>
      <div className="md:col-span-1 xl:col-span-7 [&>*]:h-full">
        <RecentCard {...props} />
      </div>
      <div className="flex flex-col gap-4 lg:gap-5 md:col-span-1 xl:col-span-5 [&>*]:flex-1">{props.giving}</div>
    </div>
  )
}
