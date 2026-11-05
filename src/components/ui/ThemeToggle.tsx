import clsx from 'clsx'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/theme'

/** A round Sun / Moon button that switches between the light and dark themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const toDark = theme === 'light'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={toDark ? 'Switch to dark theme' : 'Switch to light theme'}
      title={toDark ? 'Dark theme' : 'Light theme'}
      className={clsx(
        'w-10 h-10 shrink-0 rounded-full bg-surface border border-border flex items-center justify-center text-secondary hover:text-white transition-colors',
        className,
      )}
    >
      {toDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
