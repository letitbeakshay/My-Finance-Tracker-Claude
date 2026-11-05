import type { ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { formatCurrency } from '../../lib/currency'

export interface TransactionRow {
  key: string
  kind: 'expense' | 'income'
  date: string
  createdAt: number
  icon: ReactNode
  title: string
  note?: string
  accountLabel: string
  /** The answer to "does this please God?" when there is one. */
  pleasesGod?: boolean
  tag: { label: string; color: string }
  amount: number
}

export type TransactionFilter = 'all' | 'expense' | 'income'

const FILTERS: { value: TransactionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
]

interface TransactionsPanelProps {
  rows: TransactionRow[]
  filter: TransactionFilter
  onFilter: (filter: TransactionFilter) => void
  search: string
  onSearch: (value: string) => void
  onSelect: (key: string) => void
  /** Hide the All/Expenses/Income chips (when the section already fixes the type). */
  hideFilters?: boolean
  title?: string
}

export function TransactionsPanel({
  rows,
  filter,
  onFilter,
  search,
  onSearch,
  onSelect,
  hideFilters,
  title = 'Transactions',
}: TransactionsPanelProps) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5 pb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-white text-[19px] font-bold">{title}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            className="h-11 sm:w-48 bg-surface border border-border rounded-chip px-4 text-[16px] text-white placeholder:text-tertiary"
          />
          {!hideFilters && (
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <Chip key={f.value} selected={filter === f.value} onClick={() => onFilter(f.value)}>
                {f.label}
              </Chip>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* Column headers — desktop only */}
      <div className="hidden md:grid grid-cols-[84px_minmax(0,1fr)_170px_90px_120px] gap-4 px-5 py-2.5 border-y border-border/60 text-tertiary text-[12px] font-semibold uppercase tracking-wide">
        <span>Date</span>
        <span>Details</span>
        <span>Account</span>
        <span>Type</span>
        <span className="text-right">Amount</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-secondary text-[15px] text-center py-14">Nothing here for this month.</p>
      ) : (
        <div className="divide-y divide-border/60 max-h-[70dvh] overflow-y-auto">
          {rows.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onSelect(r.key)}
              className="w-full text-left px-5 py-3.5 flex items-center gap-3.5 md:grid md:grid-cols-[84px_minmax(0,1fr)_170px_90px_120px] md:gap-4 hover:bg-surface/60 transition-colors"
            >
              <span className="hidden md:block text-secondary text-[14px]">
                {format(parseISO(r.date), 'd MMM')}
              </span>

              <span className="flex items-center gap-3.5 min-w-0 flex-1 md:flex-none">
                <span className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
                  {r.icon}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-white font-medium text-[15px]">
                    <span className="truncate">{r.title}</span>
                    {r.pleasesGod === true && <Check size={14} strokeWidth={2.6} className="text-positive shrink-0" aria-label="Pleases God" />}
                    {r.pleasesGod === false && <X size={14} strokeWidth={2.6} className="text-danger shrink-0" aria-label="Does not please God" />}
                  </span>
                  <span className="block text-tertiary text-[13px] truncate">
                    <span className="md:hidden">
                      {[format(parseISO(r.date), 'd MMM'), r.accountLabel === '—' ? '' : r.accountLabel, r.note]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="hidden md:inline">{r.note}</span>
                  </span>
                </span>
              </span>

              <span className="hidden md:block text-secondary text-[14px] truncate">{r.accountLabel}</span>

              <span className="hidden md:flex items-center">
                <span
                  className="text-[12px] font-semibold rounded-full px-2.5 py-1"
                  style={{ color: r.tag.color, background: `${r.tag.color}24` }}
                >
                  {r.tag.label}
                </span>
              </span>

              <span
                className={clsx(
                  'font-semibold text-[15px] tabular-nums shrink-0 md:text-right',
                  r.kind === 'income' ? 'text-positive' : 'text-white',
                )}
              >
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
