import clsx from 'clsx'
import { SECTION_ICONS } from '../../lib/dataIcons'

export type Section = 'overview' | 'transactions' | 'income' | 'expenses' | 'loans' | 'accounts'

const ITEMS: { value: Section; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'income', label: 'Income' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'loans', label: 'Loans' },
  { value: 'accounts', label: 'Cards & accounts' },
]

interface SectionNavProps {
  value: Section
  onChange: (section: Section) => void
  /** Optional small count shown beside a section's label. */
  counts?: Partial<Record<Section, number>>
}

/** Sidebar on desktop, horizontally scrollable tab bar on mobile. */
export function SectionNav({ value, onChange, counts }: SectionNavProps) {
  return (
    <nav
      aria-label="All data sections"
      className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-1 mb-5 lg:mx-0 lg:px-0 lg:mb-0 lg:pb-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:sticky lg:top-[76px] lg:self-start"
    >
      {ITEMS.map((item) => {
        const active = item.value === value
        const count = counts?.[item.value]
        const Icon = SECTION_ICONS[item.value]
        return (
          <button
            key={item.value}
            type="button"
            onClick={(e) => {
              onChange(item.value)
              // Keep the chosen tab visible in the mobile scroll bar.
              e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
            }}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'shrink-0 flex items-center gap-2.5 h-11 px-4 rounded-chip border text-[15px] font-medium transition-colors whitespace-nowrap lg:w-full lg:rounded-2xl lg:border-transparent',
              active
                ? 'bg-accent-soft border-accent text-accent lg:border-transparent'
                : 'bg-surface border-border text-white lg:bg-transparent lg:text-secondary lg:hover:bg-surface lg:hover:text-white',
            )}
          >
            <Icon size={18} strokeWidth={2.2} className="shrink-0" />
            <span className="lg:flex-1 lg:text-left">{item.label}</span>
            {count != null && (
              <span className={clsx('text-[12px] tabular-nums', active ? 'text-accent' : 'text-tertiary')}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
