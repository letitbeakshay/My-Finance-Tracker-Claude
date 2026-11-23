import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { Check, ChevronRight, FileUp, X } from 'lucide-react'
import { Card } from '../ui/card'
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
  /** The answer to "is this expense necessary?" when there is one. */
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
  /** Shows an "Import statement" button that opens the bulk-import popup. */
  onImport?: () => void
  /** Show only the first few rows, with a "View all" link (the Dashboard overview). */
  limit?: number
  onViewAll?: () => void
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
  onImport,
  limit,
  onViewAll,
}: TransactionsPanelProps) {
  const shown = limit ? rows.slice(0, limit) : rows
  // In the narrower Dashboard column, the account moves into the second line so the details have room.
  const compact = !!limit
  const cols = compact ? 'md:grid-cols-[72px_minmax(0,1fr)_84px_110px]' : 'md:grid-cols-[84px_minmax(0,1fr)_170px_90px_120px]'
  const more = limit ? Math.max(0, rows.length - limit) : 0
  return (
    <Card padded={false} className="overflow-hidden">
      <div className={clsx('p-5 pb-4 flex flex-col gap-3', !compact && 'sm:flex-row sm:items-center sm:justify-between sm:gap-4')}>
        <h2 className="text-white text-[18px] font-bold">{title}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex gap-2 sm:contents">
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            className={clsx('h-11 bg-surface border border-border rounded-chip px-4 text-[16px] text-white placeholder:text-tertiary', compact ? 'flex-1 min-w-0 sm:min-w-[140px]' : 'flex-1 min-w-0 sm:flex-none sm:w-48')}
          />
          {onImport && (
            <button type="button" onClick={onImport} className="h-11 px-4 rounded-chip border border-border bg-surface text-white text-[15px] font-medium flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-[var(--duration-quick)] hover:bg-surface/60">
              <FileUp size={16} /> {compact ? 'Import' : 'Import statement'}
            </button>
          )}
          </div>
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
      <div className={clsx('hidden md:grid gap-4 px-5 py-2.5 border-y border-border/60 text-tertiary text-[12px] font-semibold uppercase tracking-wide', cols)}>
        <span>Date</span>
        <span>Details</span>
        {!compact && <span>Account</span>}
        <span>Type</span>
        <span className="text-right">Amount</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-secondary text-[15px] text-center py-14">Nothing here for this month.</p>
      ) : (
        <div className={clsx('divide-y divide-border/60', !limit && 'max-h-[70dvh] overflow-y-auto')}>
          {shown.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onSelect(r.key)}
              className={clsx('w-full text-left px-5 py-3 flex items-center gap-3.5 md:grid md:gap-4 hover:bg-surface/60 transition-colors duration-[var(--duration-quick)]', cols)}
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
                    {r.pleasesGod === true && <Check size={14} strokeWidth={2.6} className="text-positive shrink-0" aria-label="Necessary" />}
                    {r.pleasesGod === false && <X size={14} strokeWidth={2.6} className="text-danger shrink-0" aria-label="Not necessary" />}
                  </span>
                  <span className="block text-tertiary text-[13px] truncate">
                    <span className="md:hidden">
                      {[format(parseISO(r.date), 'd MMM'), r.accountLabel === '—' ? '' : r.accountLabel, r.note]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="hidden md:inline">{compact ? [r.accountLabel === '—' ? '' : r.accountLabel, r.note].filter(Boolean).join(' · ') : r.note}</span>
                  </span>
                </span>
              </span>

              {!compact && <span className="hidden md:block text-secondary text-[14px] truncate">{r.accountLabel}</span>}

              <span className="hidden md:flex items-center">
                <span
                  className="text-[12px] font-semibold rounded-full px-2.5 py-1"
                  style={{ color: r.tag.color, background: `color-mix(in srgb, ${r.tag.color} 14%, transparent)` }}
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
      {more > 0 && onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="w-full border-t border-border/60 px-5 py-3.5 text-[14px] font-semibold text-accent-ink hover:bg-surface/60 transition-colors duration-[var(--duration-quick)] flex items-center justify-center gap-1.5"
        >
          View all {rows.length} <ChevronRight size={16} />
        </button>
      )}
    </Card>
  )
}
