import type { PaymentMethod } from '../types'

export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  upi: '📲',
  credit_card: '💳',
  debit_card: '💳',
  cash: '💵',
  bank_transfer: '🏦',
  wallet: '👛',
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  'upi',
  'credit_card',
  'debit_card',
  'cash',
  'bank_transfer',
  'wallet',
]
