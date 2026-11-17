import { Banknote, CreditCard, Landmark, Smartphone, Wallet, type LucideIcon } from 'lucide-react'
import type { PaymentMethod } from '../types'

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  upi: Smartphone,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cash: Banknote,
  bank_transfer: Landmark,
  wallet: Wallet,
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'upi',
  'credit_card',
  'debit_card',
  'cash',
  'bank_transfer',
  'wallet',
]
