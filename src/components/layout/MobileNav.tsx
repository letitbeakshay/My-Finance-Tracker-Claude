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
      className={clsx(
        'flex-1 flex flex-col items-center gap-1 py-1 transition-colors',
        active ? 'text-accent-ink' : 'text-tertiary',
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      <span className="text-[11px] font-medium">{label}</span>
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
        className="pointer-events-auto flex items-center bg-card/95 backdrop-blur-xl border border-border rounded-3xl px-2 h-[68px]"
        style={{ boxShadow: '0 8px 24px rgba(60,58,59,0.12)' }}
      >
        <Item label="Expense" icon={Receipt} active={active === 'expense'} onClick={onExpense} />
        <Item label="Insights" icon={ChartColumn} active={active === 'insights'} onClick={onInsights} />

        <div className="w-[72px] flex justify-center shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            aria-label="Add expense"
            className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center -mt-7"
            style={{ boxShadow: '0 6px 16px rgba(60,58,59,0.25)' }}
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
