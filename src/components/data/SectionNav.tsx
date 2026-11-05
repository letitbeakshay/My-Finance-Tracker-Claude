import { useState } from 'react'
import clsx from 'clsx'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { SECTION_ICONS } from '../../lib/dataIcons'

export type Section = 'overview' | 'budgets' | 'stewardship' | 'reimbursements' | 'transactions' | 'income' | 'expenses' | 'loans' | 'accounts'

const ITEMS: { value: Section; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'stewardship', label: 'Stewardship' },
  { value: 'reimbursements', label: 'Reimbursements' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'income', label: 'Income' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'loans', label: 'Loans' },
  { value: 'accounts', label: 'Cards & accounts' },
]

const PIN_KEY = 'finance_tracker_nav_pinned'
const RAIL_WIDTH = 56
const OPEN_WIDTH = 224

function readPinned() {
  try {
    return localStorage.getItem(PIN_KEY) === 'true'
  } catch {
    return false
  }
}

interface SectionNavProps {
  value: Section
  onChange: (section: Section) => void
  /** Optional small count shown beside a section's label. */
  counts?: Partial<Record<Section, number>>
}

/**
 * Phones and tablets: a scrollable tab bar. Desktop: a slim icon rail that opens over
 * the page on hover, and can be pinned open (pushing the content) or minimised again.
 */
export function SectionNav({ value, onChange, counts }: SectionNavProps) {
  const [pinned, setPinned] = useState(readPinned)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  function togglePinned() {
    const next = !pinned
    setPinned(next)
    try {
      localStorage.setItem(PIN_KEY, String(next))
    } catch {
      // Remembering the menu state is a convenience only.
    }
  }

  return (
    <>
      <nav
        aria-label="Dashboard sections"
        className="lg:hidden flex gap-2 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-1 mb-5"
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
                // Keep the chosen tab visible in the scroll bar.
                e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
              }}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'shrink-0 flex items-center gap-2.5 h-11 px-4 rounded-chip border text-[15px] font-medium transition-colors whitespace-nowrap',
                active ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white',
              )}
            >
              <Icon size={18} strokeWidth={2.2} className="shrink-0" />
              <span>{item.label}</span>
              {count != null && (
                <span className={clsx('text-[12px] tabular-nums', active ? 'text-accent-ink' : 'text-tertiary')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Desktop: this wrapper reserves the space; the nav inside can grow over the content. */}
      <div
        className="hidden lg:block relative shrink-0 transition-[width] duration-200"
        style={{ width: pinned ? OPEN_WIDTH : RAIL_WIDTH }}
      >
        <nav
          aria-label="Dashboard sections"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ width: expanded ? OPEN_WIDTH : RAIL_WIDTH }}
          className={clsx(
            'sticky top-[76px] z-30 overflow-hidden bg-card border border-border rounded-2xl p-1.5 flex flex-col gap-1 transition-[width,box-shadow] duration-200',
            expanded && !pinned && 'shadow-[0_12px_32px_rgba(60,58,59,0.14)]',
          )}
        >
          {ITEMS.map((item) => {
            const active = item.value === value
            const count = counts?.[item.value]
            const Icon = SECTION_ICONS[item.value]
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onChange(item.value)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                title={expanded ? undefined : item.label}
                className={clsx(
                  'h-11 w-full flex items-center gap-3 pl-[13px] pr-3 rounded-xl text-[15px] font-medium whitespace-nowrap transition-colors',
                  active ? 'bg-accent-soft text-accent-ink' : 'text-secondary hover:bg-surface hover:text-white',
                )}
              >
                <Icon size={18} strokeWidth={2.2} className="shrink-0" />
                <span className={clsx('flex-1 text-left transition-opacity duration-150', expanded ? 'opacity-100' : 'opacity-0')}>
                  {item.label}
                </span>
                {count != null && expanded && (
                  <span className={clsx('text-[12px] tabular-nums', active ? 'text-accent-ink' : 'text-tertiary')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          <div className="h-px bg-border my-1" />
          <button
            type="button"
            onClick={togglePinned}
            aria-pressed={pinned}
            aria-label={pinned ? 'Minimise menu' : 'Keep menu open'}
            title={expanded ? undefined : 'Keep menu open'}
            className="h-11 w-full flex items-center gap-3 pl-[13px] pr-3 rounded-xl text-[14px] font-medium whitespace-nowrap text-tertiary hover:bg-surface hover:text-white transition-colors"
          >
            {pinned ? (
              <PanelLeftClose size={18} strokeWidth={2.2} className="shrink-0" />
            ) : (
              <PanelLeftOpen size={18} strokeWidth={2.2} className="shrink-0" />
            )}
            <span className={clsx('flex-1 text-left transition-opacity duration-150', expanded ? 'opacity-100' : 'opacity-0')}>
              {pinned ? 'Minimise menu' : 'Keep menu open'}
            </span>
          </button>
        </nav>
      </div>
    </>
  )
}
