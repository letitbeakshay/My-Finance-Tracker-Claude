/** Client-side passcode only — a UI gate, not real access control.
 * The real data store (Supabase) still needs its own RLS policy since
 * this check is trivially bypassed by anyone with devtools. */
const PASSCODE = 'muu'

/** You stay signed in for this long after you last used the app. */
export const SESSION_DAYS = 30
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000

const UNTIL_KEY = 'finance_tracker_unlocked_until'
/** Older versions stored a plain "true" that never expired; it is upgraded on first use. */
const LEGACY_KEY = 'finance_tracker_unlocked'

function extend() {
  localStorage.setItem(UNTIL_KEY, String(Date.now() + SESSION_MS))
  localStorage.removeItem(LEGACY_KEY)
}

export function isUnlocked() {
  try {
    const until = Number(localStorage.getItem(UNTIL_KEY))
    if (until > Date.now()) return true
    // Someone already signed in with the old version: keep them in, now with a 30-day clock.
    if (!until && localStorage.getItem(LEGACY_KEY) === 'true') {
      extend()
      return true
    }
  } catch {
    // Storage blocked: behave as locked.
  }
  return false
}

/** Using the app keeps the session going: 30 days from the last time you opened it. */
export function touchSession() {
  try {
    if (Number(localStorage.getItem(UNTIL_KEY)) > Date.now()) extend()
  } catch {
    // Nothing to extend.
  }
}

export function tryUnlock(input: string) {
  const ok = input.trim().toLowerCase() === PASSCODE
  if (ok) {
    try {
      extend()
    } catch {
      // Storage blocked: the unlock lasts for this visit only.
    }
  }
  return ok
}

export function lock() {
  try {
    localStorage.removeItem(UNTIL_KEY)
    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // Nothing stored to clear.
  }
}
