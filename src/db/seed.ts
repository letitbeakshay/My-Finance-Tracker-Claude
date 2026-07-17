import { db } from './db'
import type { Category } from '../types'

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
 * must not race two bulkAdd calls against the same primary keys. */
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
  const count = await db.categories.count()
  if (count === 0) {
    const base = Date.now()
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c, i) => ({ ...c, createdAt: base + i })),
    )
  }

  const settings = await db.settings.get('app')
  if (!settings) {
    await db.settings.put({ id: 'app', currency: '₹' })
  }
}
