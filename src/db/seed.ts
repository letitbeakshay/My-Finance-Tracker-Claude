import { supabase } from '../lib/supabaseClient'
import type { Category } from '../types'
import { categoryToRow } from './schema'

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'food', name: 'Food', icon: '🍔' },
  { id: 'coffee', name: 'Coffee', icon: '☕' },
  { id: 'fuel', name: 'Fuel', icon: '🛵' },
  { id: 'shopping', name: 'Shopping', icon: '🛍' },
  { id: 'entertainment', name: 'Entertainment', icon: '🍿' },
  { id: 'rent', name: 'Rent', icon: '🏠' },
  { id: 'medical', name: 'Medical', icon: '💊' },
  { id: 'recharge', name: 'Recharge', icon: '📱' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'gift', name: 'Gift', icon: '🎁' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'bills', name: 'Bills', icon: '💡' },
  { id: 'emi', name: 'EMI', icon: '🏦' },
  { id: 'investment', name: 'Investment', icon: '💰' },
  { id: 'others', name: 'Others', icon: '📦' },
]

let seedPromise: Promise<void> | null = null

/** Idempotent and concurrency-safe: React StrictMode / fast double-mounts
 * must not race two inserts against the same primary keys. */
export function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedOnce().catch((err) => {
      seedPromise = null
      throw err
    })
  }
  return seedPromise
}

async function seedOnce() {
  const { count, error: countError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
  if (countError) throw countError

  if (!count) {
    const rows = DEFAULT_CATEGORIES.map((c, i) => categoryToRow({ ...c, sortOrder: i }))
    const { error } = await supabase.from('categories').insert(rows)
    if (error) throw error
  }

  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'app')
    .maybeSingle()
  if (settingsError) throw settingsError

  if (!settings) {
    const { error } = await supabase.from('app_settings').insert({ id: 'app', currency: '₹' })
    if (error) throw error
  }

  // Never let the optional giving seed block the app from loading.
  try {
    await seedGivingCategories(settings as { giving_seeded?: boolean } | null)
  } catch (err) {
    console.error('Could not seed giving categories', err)
  }
}

export const GIVING_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'tithe', name: 'Tithe', icon: '🙏' },
  { id: 'offering', name: 'Offering', icon: '🕊️' },
  { id: 'missions', name: 'Missions', icon: '🌍' },
  { id: 'charity', name: 'Helping others', icon: '🤝' },
]

/** One-time, per database: adds the giving categories, then records that it
 * did so (giving_seeded) so a category the user later deletes stays deleted.
 * Skipped silently until the stewardship migration has added that column. */
async function seedGivingCategories(settings: { giving_seeded?: boolean } | null) {
  if (!settings || settings.giving_seeded !== false) return

  const { data: existing, error: existingError } = await supabase
    .from('categories')
    .select('id, sort_order')
  if (existingError) throw existingError

  const have = new Set((existing ?? []).map((c) => c.id as string))
  const base = Math.max(-1, ...(existing ?? []).map((c) => Number(c.sort_order))) + 1
  const rows = GIVING_CATEGORIES.filter((c) => !have.has(c.id)).map((c, i) =>
    categoryToRow({ ...c, sortOrder: base + i }),
  )
  if (rows.length) {
    const { error } = await supabase.from('categories').insert(rows)
    if (error) throw error
  }

  const { error } = await supabase.from('app_settings').update({ giving_seeded: true }).eq('id', 'app')
  if (error) throw error
}
