import { supabase } from '../lib/supabaseClient'
import { DEFAULT_PLAN } from '../lib/categoryPlan'
import { categoryPlanRepo } from './repository'

let seedPromise: Promise<void> | null = null

/**
 * First sign-in on a new account: create the settings row and the starting categories.
 * Idempotent and safe if the app opens twice (a second tab, React StrictMode).
 */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((err) => {
      seedPromise = null
      throw err
    })
  }
  return seedPromise
}

/** Forget the cached result, so the next person who signs in on this device is set up fresh. */
export function resetSeeding() {
  seedPromise = null
}

async function seedOnce() {
  const { data: settings, error } = await supabase.from('app_settings').select('onboarded_at').eq('id', 'app').maybeSingle()
  if (error) throw error

  if (!settings) {
    // The settings row is the lock: only the tab that manages to create it sets up the categories.
    const { error: insertError } = await supabase.from('app_settings').insert({ id: 'app', currency: '₹', giving_seeded: true })
    if (insertError) {
      if (insertError.code === '23505') return
      throw insertError
    }
    await seedCategories()
    return
  }

  // Setup was cut short before the person finished the welcome steps: finish it.
  if (!settings.onboarded_at) await seedCategories()
}

async function seedCategories() {
  const { count, error } = await supabase.from('categories').select('id', { count: 'exact', head: true })
  if (error) throw error
  if (!count) await categoryPlanRepo.apply([], DEFAULT_PLAN)
}
