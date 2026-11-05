/** Remembers where you were, so coming back (or a phone reloading the app) puts you in the same place. */
const KEY = 'finance_tracker_session'
/** After this long away it counts as a fresh visit and the app opens on the amount screen again. */
const FRESH_AFTER_MS = 30 * 60 * 1000

interface Session {
  view: 'enter' | 'data'
  /** Which Dashboard section was open. */
  section?: string
  at: number
}

function load(): Session | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null
    return parsed && typeof parsed.at === 'number' ? parsed : null
  } catch {
    return null
  }
}

/** The saved place, or null when there is none or it is old (a fresh visit). */
export function readSession(): Session | null {
  const s = load()
  return s && Date.now() - s.at < FRESH_AFTER_MS ? s : null
}

export function writeSession(patch: Partial<Omit<Session, 'at'>>) {
  try {
    const current = readSession() ?? { view: 'enter' as const }
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, at: Date.now() }))
  } catch {
    // Remembering is a convenience only.
  }
}

/** Marks the session as still in use (called when the app is left), without changing where you are. */
export function keepSessionFresh() {
  const s = readSession()
  if (s) writeSession({})
}
