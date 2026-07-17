import { db } from './db'
import type { Category, Expense } from '../types'

function generateId() {
  return crypto.randomUUID()
}

export const expenseRepo = {
  async add(input: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now()
    const expense: Expense = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      source: input.source ?? 'manual',
    }
    await db.expenses.add(expense)
    return expense
  },

  async update(id: string, changes: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    await db.expenses.update(id, { ...changes, updatedAt: Date.now() })
  },

  async remove(id: string) {
    await db.expenses.delete(id)
  },

  async all() {
    return db.expenses.toArray()
  },
}

export const categoryRepo = {
  async add(input: Omit<Category, 'id' | 'createdAt'>) {
    const category: Category = {
      ...input,
      id: generateId(),
      createdAt: Date.now(),
    }
    await db.categories.add(category)
    return category
  },

  async rename(id: string, name: string, icon?: string) {
    await db.categories.update(id, icon ? { name, icon } : { name })
  },

  async archive(id: string) {
    await db.categories.update(id, { archived: true })
  },

  async remove(id: string) {
    const inUse = await db.expenses.where('categoryId').equals(id).count()
    if (inUse > 0) {
      await db.categories.update(id, { archived: true })
      return { archived: true }
    }
    await db.categories.delete(id)
    return { archived: false }
  },
}

export const dataRepo = {
  async exportJSON() {
    const [expenses, categories, settings] = await Promise.all([
      db.expenses.toArray(),
      db.categories.toArray(),
      db.settings.toArray(),
    ])
    return JSON.stringify({ expenses, categories, settings, exportedAt: Date.now() }, null, 2)
  },

  async exportCSV() {
    const expenses = await db.expenses.toArray()
    const categories = await db.categories.toArray()
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
    const header = ['Date', 'Category', 'Type', 'Payment Method', 'Amount', 'Notes']
    const rows = expenses.map((e) => [
      e.date,
      categoryMap.get(e.categoryId) ?? e.categoryId,
      e.type,
      e.paymentMethod,
      e.amount.toString(),
      (e.notes ?? '').replace(/"/g, '""'),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    return csv
  },

  async deleteAll() {
    await db.expenses.clear()
    await db.categories.clear()
    await db.settings.clear()
  },
}
