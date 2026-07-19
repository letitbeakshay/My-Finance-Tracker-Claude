/**
 * Asks the browser to exempt this origin's storage (localStorage,
 * IndexedDB) from automatic eviction under storage pressure. Without this,
 * Chrome can silently clear an installed home-screen PWA's local data if
 * it isn't opened often enough, which looks like "the app forgot I
 * unlocked it" — this is the fix for that, not a guarantee (the browser
 * can still decline), but it materially reduces how often it happens.
 */
export async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return
  try {
    const alreadyPersisted = await navigator.storage.persisted?.()
    if (alreadyPersisted) return
    await navigator.storage.persist()
  } catch {
    // Best-effort — unsupported or denied is fine, nothing to recover from.
  }
}
