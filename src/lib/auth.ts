const STORAGE_KEY = 'finance_tracker_unlocked'

/** Client-side passcode only — a UI gate, not real access control.
 * The real data store (Supabase) still needs its own RLS policy since
 * this check is trivially bypassed by anyone with devtools. */
const PASSCODE = 'muu'

export function isUnlocked() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function tryUnlock(input: string) {
  const ok = input.trim().toLowerCase() === PASSCODE
  if (ok) localStorage.setItem(STORAGE_KEY, 'true')
  return ok
}

export function lock() {
  localStorage.removeItem(STORAGE_KEY)
}
