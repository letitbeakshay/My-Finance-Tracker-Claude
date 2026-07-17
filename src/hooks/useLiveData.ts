import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function useExpenses() {
  return useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), [], [])
}

export function useCategories() {
  return useLiveQuery(
    () =>
      db.categories
        .filter((c) => !c.archived)
        .toArray()
        .then((list) => list.sort((a, b) => a.createdAt - b.createdAt)),
    [],
    [],
  )
}

export function useAllCategories() {
  return useLiveQuery(
    () => db.categories.toArray().then((list) => list.sort((a, b) => a.createdAt - b.createdAt)),
    [],
    [],
  )
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get('app'), [], undefined)
}
