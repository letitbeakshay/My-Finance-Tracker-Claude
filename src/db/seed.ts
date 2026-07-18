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
    const rows = DEFAULT_CATEGORIES.map((c) => categoryToRow(c))
    const { error } = await supabase.from('categories').insert(rows)
    if (error) throw error
  }

  const { data: settings, error: settingsError } = await supabase
    .from('app_settings')
    .select('id')
    .eq('id', 'app')
    .maybeSingle()
  if (settingsError) throw settingsError

  if (!settings) {
    const { error } = await supabase.from('app_settings').insert({ id: 'app', currency: '₹' })
    if (error) throw error
  }
}
