import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  Budget,
  Category,
  Expense,
  Income,
  RecurringExpense,
  Wallet,
} from '../types'

/**
 * Single Dexie database for the app. Tables for not-yet-built features
 * (income, budgets, recurring, wallets) are declared now so future work
 * only adds logic, not migrations.
 */
class FinanceDB extends Dexie {
  expenses!: EntityTable<Expense, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<AppSettings, 'id'>

  // Reserved for future features — tables exist, screens don't yet.
  income!: EntityTable<Income, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  recurringExpenses!: EntityTable<RecurringExpense, 'id'>
  wallets!: EntityTable<Wallet, 'id'>

  constructor() {
    super('finance-tracker')

    this.version(1).stores({
      expenses: 'id, date, categoryId, type, paymentMethod, createdAt',
      categories: 'id, name, archived',
      settings: 'id',
      income: 'id, date',
      budgets: 'id, categoryId, type',
      recurringExpenses: 'id, nextRunDate, active',
      wallets: 'id, isDefault',
    })
  }
}

export const db = new FinanceDB()
