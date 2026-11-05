import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Clapperboard,
  Coffee,
  CreditCard,
  Fuel,
  Gift,
  Globe,
  HandHeart,
  HeartHandshake,
  Home,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  Package,
  Pill,
  Plane,
  ShoppingBag,
  Shirt,
  Smartphone,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { PaymentAccountType } from '../types'

/** Icons for the built-in categories; custom categories fall back to a tag. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  coffee: Coffee,
  fuel: Fuel,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  rent: Home,
  medical: Pill,
  recharge: Smartphone,
  education: BookOpen,
  clothing: Shirt,
  gift: Gift,
  travel: Plane,
  work: Briefcase,
  bills: Lightbulb,
  emi: Landmark,
  investment: TrendingUp,
  others: Package,
  tithe: HandHeart,
  offering: Gift,
  missions: Globe,
  charity: HeartHandshake,
}

/** The built-in line icon for a category id, or undefined for categories the user created. */
export function builtInCategoryIcon(categoryId?: string): LucideIcon | undefined {
  return categoryId ? CATEGORY_ICONS[categoryId] : undefined
}

export const ACCOUNT_ICONS: Record<PaymentAccountType, LucideIcon> = {
  bank_account: Landmark,
  credit_card: CreditCard,
}

export const INCOME_ICON = ArrowDownLeft
export const UNASSIGNED_ICON = Wallet

export const SECTION_ICONS = {
  overview: LayoutDashboard,
  budgets: Target,
  stewardship: HandHeart,
  transactions: ArrowLeftRight,
  income: ArrowDownLeft,
  expenses: ArrowUpRight,
  loans: Landmark,
  accounts: CreditCard,
} as const
