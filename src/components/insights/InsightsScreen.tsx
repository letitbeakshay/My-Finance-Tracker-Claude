import { useMemo, useState } from 'react'
import { parseISO } from 'date-fns'
import { useAllPaymentAccounts, useCategories, useExpenses } from '../../hooks/useLiveData'
import {
  categoryBreakdown,
  filterByMonth,
  paymentMethodBreakdown,
  sum,
  typeBreakdown,
  weeklySpending,
} from '../../lib/analytics'
import { MonthSelector } from './MonthSelector'
import { StatCards } from './StatCards'
import { CategoryPieChart } from './CategoryPieChart'
import { WeeklyBarChart } from './WeeklyBarChart'
import { PaymentMethodChart } from './PaymentMethodChart'
import { TopCategories } from './TopCategories'
import { RegretList } from './RegretList'
import { MonthlySummary } from './MonthlySummary'
import { SearchBar } from './SearchBar'
import { FilterSheet, type Filters } from './FilterSheet'
import { TransactionItem } from '../home/TransactionItem'
import { TransactionSheet } from './TransactionSheet'
import { EmptyState } from '../ui/EmptyState'
import { SettingsIcon } from '../ui/icons'
import type { Expense } from '../../types'

interface InsightsScreenProps {
  onOpenSettings: () => void
}

export function InsightsScreen({ onOpenSettings }: InsightsScreenProps) {
  const expenses = useExpenses()
  const categories = useCategories()
  const accounts = useAllPaymentAccounts()
  const [month, setMonth] = useState(new Date())
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>({ categoryId: null, type: null, paymentMethod: null })
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected] = useState<Expense | null>(null)

  const categoryMap = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const accountMap = useMemo(() => new Map((accounts ?? []).map((a) => [a.id, a])), [accounts])

  const monthExpenses = useMemo(() => filterByMonth(expenses ?? [], month), [expenses, month])

  const breakdown = useMemo(() => typeBreakdown(monthExpenses), [monthExpenses])
  const catBreakdown = useMemo(() => categoryBreakdown(monthExpenses), [monthExpenses])
  const payBreakdown = useMemo(() => paymentMethodBreakdown(monthExpenses), [monthExpenses])
  const weeks = useMemo(() => weeklySpending(monthExpenses, month), [monthExpenses, month])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const filteredResults = useMemo(() => {
    let list = monthExpenses
    if (filters.categoryId) list = list.filter((e) => e.categoryId === filters.categoryId)
    if (filters.type) list = list.filter((e) => e.type === filters.type)
    if (filters.paymentMethod) list = list.filter((e) => e.paymentMethod === filters.paymentMethod)

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((e) => {
        const category = categoryMap.get(e.categoryId)
        const dateLabel = parseISO(e.date).toLocaleDateString('en-IN')
        return (
          category?.name.toLowerCase().includes(q) ||
          e.notes?.toLowerCase().includes(q) ||
          String(e.amount).includes(q) ||
          dateLabel.includes(q)
        )
      })
    }
    return list
  }, [monthExpenses, filters, search, categoryMap])

  const isFilteringOrSearching = search.trim().length > 0 || activeFilterCount > 0

  if (!expenses) return null

  return (
    <div className="px-6 pt-14">
      <div className="flex items-center justify-between -mb-2">
        <div className="flex-1">
          <MonthSelector month={month} onChange={setMonth} />
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center ml-2 -mt-7"
          aria-label="Settings"
        >
          <SettingsIcon size={17} />
        </button>
      </div>

      {monthExpenses.length === 0 ? (
        <EmptyState title="No expenses this month yet." />
      ) : (
        <>
          <StatCards
            total={sum(monthExpenses)}
            needs={breakdown.needs}
            wants={breakdown.wants}
            savings={breakdown.savings}
          />

          <SearchBar
            value={search}
            onChange={setSearch}
            onOpenFilters={() => setFilterOpen(true)}
            activeFilterCount={activeFilterCount}
          />

          {isFilteringOrSearching ? (
            <div className="mb-8">
              <h3 className="text-white text-[17px] font-bold mb-1">
                {filteredResults.length} result{filteredResults.length === 1 ? '' : 's'}
              </h3>
              {filteredResults.length === 0 ? (
                <EmptyState title="No matching transactions." />
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredResults.map((e) => (
                    <TransactionItem
                      key={e.id}
                      expense={e}
                      category={categoryMap.get(e.categoryId)}
                      account={e.accountId ? accountMap.get(e.accountId) : undefined}
                      onClick={() => setSelected(e)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <CategoryPieChart breakdown={catBreakdown} categoryMap={categoryMap} />
              <WeeklyBarChart weeks={weeks} />
              <PaymentMethodChart breakdown={payBreakdown} />
              <TopCategories breakdown={catBreakdown} categoryMap={categoryMap} />
              <RegretList expenses={monthExpenses} categoryMap={categoryMap} onSelect={setSelected} />
              <MonthlySummary
                needsPct={breakdown.needsPct}
                wantsPct={breakdown.wantsPct}
                savingsPct={breakdown.savingsPct}
              />
            </>
          )}
        </>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories ?? []}
        filters={filters}
        onChange={setFilters}
      />

      <TransactionSheet
        expense={selected}
        category={selected ? categoryMap.get(selected.categoryId) : undefined}
        account={selected?.accountId ? accountMap.get(selected.accountId) : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
