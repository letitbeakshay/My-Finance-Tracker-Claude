import { supabase } from '../lib/supabaseClient'
import type { Category, Expense } from '../types'
import {
  categoryToRow,
  expenseToRow,
  rowToCategory,
  rowToExpense,
  type CategoryRow,
  type ExpenseRow,
} from './schema'

function generateId() {
  return crypto.randomUUID()
}

export const expenseRepo = {
  async add(input: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = generateId()
    const row = expenseToRow({ ...input, id, source: input.source ?? 'manual' })
    const { data, error } = await supabase
      .from('expenses')
      .insert(row)
      .select()
      .single<ExpenseRow>()
    if (error) throw error
    return rowToExpense(data)
  },

  async update(id: string, changes: Partial<Omit<Expense, 'id' | 'createdAt'>>) {
    const row = expenseToRow({ id, ...changes } as Expense)
    delete row.id
    const { error } = await supabase
      .from('expenses')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },

  async remove(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error
  },

  async all() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    if (error) throw error
    return (data as ExpenseRow[]).map(rowToExpense)
  },
}

export const categoryRepo = {
  async add(input: Omit<Category, 'id' | 'createdAt'>) {
    const id = generateId()
    const row = categoryToRow({ ...input, id })
    const { data, error } = await supabase
      .from('categories')
      .insert(row)
      .select()
      .single<CategoryRow>()
    if (error) throw error
    return rowToCategory(data)
  },

  async rename(id: string, name: string, icon?: string) {
    const { error } = await supabase
      .from('categories')
      .update(icon ? { name, icon } : { name })
      .eq('id', id)
    if (error) throw error
  },

  async archive(id: string) {
    const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id)
    if (error) throw error
  },

  async remove(id: string) {
    const { count, error: countError } = await supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id)
    if (countError) throw countError

    if (count && count > 0) {
      const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id)
      if (error) throw error
      return { archived: true }
    }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    return { archived: false }
  },
}

export const dataRepo = {
  async exportJSON() {
    const [{ data: expenses }, { data: categories }, { data: settings }] = await Promise.all([
      supabase.from('expenses').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('app_settings').select('*'),
    ])
    return JSON.stringify(
      { expenses, categories, settings, exportedAt: Date.now() },
      null,
      2,
    )
  },

  async exportCSV() {
    const { data: expenseRows } = await supabase.from('expenses').select('*')
    const { data: categoryRows } = await supabase.from('categories').select('*')
    const expenses = ((expenseRows ?? []) as ExpenseRow[]).map(rowToExpense)
    const categories = ((categoryRows ?? []) as CategoryRow[]).map(rowToCategory)
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
    // Delete-all with a broad match since these tables have no auth-scoped owner column yet.
    await supabase.from('expenses').delete().not('id', 'is', null)
    await supabase.from('categories').delete().not('id', 'is', null)
    await supabase.from('app_settings').delete().not('id', 'is', null)
  },
}
