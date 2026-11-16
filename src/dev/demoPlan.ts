import type { PlanParent } from '../lib/categoryPlan'

/** Sample categories for the dev-only demo (`?demo`). Not shipped to people who sign up. */
export const CATEGORY_PLAN: PlanParent[] = [
  {
    name: 'Family Support',
    icon: '🏠',
    defaultType: 'need',
    children: [
      { name: 'Amma', icon: '👩' },
      { name: 'Accha', icon: '👨' },
      { name: 'Grocery', icon: '🛒' },
      { name: 'Family expenses', icon: '👪' },
      { name: 'Family allowance', icon: '💝' },
      { name: 'To Family', icon: '🏠', onlyIfExists: true },
    ],
  },
  {
    name: 'Eating Out',
    icon: '🍽️',
    defaultType: 'want',
    children: [
      { name: 'Coffee', icon: '☕' },
      { name: 'Outside Meal', icon: '🍛', matches: ['food'] },
      { name: 'Breakfast', icon: '🥞' },
      { name: 'Food delivery', icon: '🛵' },
      { name: 'Snacks', icon: '🥪' },
      { name: 'Sweets & Bakery', icon: '🍰' },
      { name: 'Treating friends', icon: '🧑‍🤝‍🧑' },
    ],
  },
  { name: 'Shopping', icon: '🛍', defaultType: 'want' },
  { name: 'Record (Reimbursable)', icon: '🧾', defaultType: 'need', reimbursable: true },
  {
    name: 'Helping Others',
    icon: '🤝',
    defaultType: 'giving',
    children: [{ name: 'Serving', icon: '🙌', onlyIfExists: true }],
  },
  {
    name: 'Giving',
    icon: '🤲',
    defaultType: 'giving',
    children: [
      { name: 'Tithe', icon: '🙏' },
      { name: 'Offering', icon: '🕊️' },
      { name: 'Missions', icon: '🌍' },
    ],
  },
  { name: 'EMI', icon: '🏦', defaultType: 'need', matches: ['emi'] },
  { name: 'Fuel', icon: '🛵', defaultType: 'need' },
  { name: 'Recharge', icon: '📱', defaultType: 'need' },
  {
    name: 'Savings',
    icon: '💰',
    defaultType: 'savings',
    children: [{ name: 'Investment', icon: '💰' }],
  },
  {
    name: 'Other Expenses',
    icon: '📦',
    defaultType: 'need',
    matches: ['others'],
    children: [
      { name: 'Medical', icon: '💊' },
      { name: 'Travel', icon: '✈️' },
      { name: 'Rent', icon: '🏠' },
      { name: 'Bills', icon: '💡' },
      { name: 'Education', icon: '📚' },
      { name: 'Clothing', icon: '👕' },
      { name: 'Gift', icon: '🎁' },
      { name: 'Work', icon: '💼' },
      { name: 'Entertainment', icon: '🍿' },
    ],
  },
]
