import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ChartColumn, LayoutDashboard, Plus, Receipt, Settings, type LucideIcon } from 'lucide-react'

export type MobileDestination = 'expense' | 'insights' | 'dashboard' | 'settings'

interface MobileNavProps {
  active: MobileDestination | null
  onExpense: () => void
  onInsights: () => void
  onAdd: () => void
  onDashboard: () => void
  onSettings: () => void
}

function Item({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
      className="flex-1 flex items-center justify-center h-full transition-colors"
    >
      <span
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
          active ? 'bg-primary text-on-primary' : 'text-tertiary',
        )}
      >
        <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
      </span>
    </button>
  )
}

/** Phone bottom menu: switches between Expense and Dashboard (the desktop top toggle's job). */
export function MobileNav({ active, onExpense, onInsights, onAdd, onDashboard, onSettings }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-3 pt-2 pointer-events-none z-30"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <div
        className="pointer-events-auto flex items-center bg-card/90 backdrop-blur-xl border border-border/70 rounded-full px-2.5 h-[68px]"
        style={{ boxShadow: '0 14px 34px -10px rgba(25,40,28,0.28)' }}
      >
        <Item label="Expense" icon={Receipt} active={active === 'expense'} onClick={onExpense} />
        <Item label="Insights" icon={ChartColumn} active={active === 'insights'} onClick={onInsights} />

        <div className="w-[72px] flex justify-center shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            aria-label="Add expense"
            className="w-14 h-14 rounded-full bg-accent text-onfill flex items-center justify-center -mt-8"
            style={{ boxShadow: '0 10px 22px -6px rgba(63,110,70,0.55)' }}
          >
            <Plus size={28} strokeWidth={2.75} />
          </motion.button>
        </div>

        <Item label="Dashboard" icon={LayoutDashboard} active={active === 'dashboard'} onClick={onDashboard} />
        <Item label="Settings" icon={Settings} active={active === 'settings'} onClick={onSettings} />
      </div>
    </div>
  )
}
