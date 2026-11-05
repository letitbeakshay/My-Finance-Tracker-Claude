import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'finance_tracker_theme'
const EVENT = 'finance-tracker-theme'
/** The browser / phone toolbar colour that goes with each theme. */
const TOOLBAR: Record<Theme, string> = { light: '#fcfbf9', dark: '#1b1a19' }

export function readTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Puts the theme on the page (the colours themselves live in index.css). */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', TOOLBAR[theme])
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Remembering the choice is a convenience only.
  }
  applyTheme(theme)
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange) // another tab changed it
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** The current theme, plus a function to flip it. Re-renders when it changes. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light' as Theme)
  const toggle = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), [])
  return { theme, toggle, set: setTheme }
}
