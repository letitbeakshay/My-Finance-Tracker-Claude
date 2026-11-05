import { motion } from 'framer-motion'
import clsx from 'clsx'

export type Tab = 'home' | 'insights'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
  onAdd: () => void
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"
      stroke={active ? '#f28c38' : '#7d7d7d'}
      strokeWidth="2"
      strokeLinejoin="round"
      fill={active ? 'rgba(242,140,56,0.12)' : 'none'}
    />
  </svg>
)

const InsightsIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 19V11M12 19V5M19 19V14"
      stroke={active ? '#f28c38' : '#7d7d7d'}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
)

export function BottomNav({ active, onChange, onAdd }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] px-6 pb-6 pt-2 z-30 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center justify-between bg-surface/95 backdrop-blur-xl border border-border rounded-[28px] px-8 h-[76px]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
      >
        <button
          type="button"
          onClick={() => onChange('home')}
          className="flex flex-col items-center gap-1 w-16"
        >
          <HomeIcon active={active === 'home'} />
          <span className={clsx('text-[11px] font-medium', active === 'home' ? 'text-accent-ink' : 'text-tertiary')}>
            Home
          </span>
        </button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          className="w-16 h-16 rounded-full bg-accent flex items-center justify-center -mt-8"
          style={{ boxShadow: '0 6px 18px rgba(242,140,56,0.3)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#181818" strokeWidth="2.75" strokeLinecap="round" />
          </svg>
        </motion.button>

        <button
          type="button"
          onClick={() => onChange('insights')}
          className="flex flex-col items-center gap-1 w-16"
        >
          <InsightsIcon active={active === 'insights'} />
          <span className={clsx('text-[11px] font-medium', active === 'insights' ? 'text-accent-ink' : 'text-tertiary')}>
            Insights
          </span>
        </button>
      </div>
    </div>
  )
}
