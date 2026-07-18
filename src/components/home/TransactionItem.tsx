import { motion } from 'framer-motion'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import type { Category, Expense, PaymentAccount } from '../../types'
import { formatCurrency } from '../../lib/currency'
import { PAYMENT_METHOD_ICONS } from '../../lib/paymentIcons'
import { PAYMENT_METHOD_LABELS } from '../../types'

interface TransactionItemProps {
  expense: Expense
  category?: Category
  account?: PaymentAccount
  onClick?: () => void
}

function relativeDate(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'd MMM')
}

const TYPE_DOT: Record<string, string> = {
  need: '#5b9dff',
  want: '#ff9f43',
  savings: '#24d968',
}

export function TransactionItem({ expense, category, account, onClick }: TransactionItemProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 py-3.5 text-left"
    >
      <div className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-xl shrink-0">
        {category?.icon ?? '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white font-medium text-[15px] truncate">{category?.name ?? 'Others'}</p>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: TYPE_DOT[expense.type] }}
          />
        </div>
        <p className="text-tertiary text-[13px] truncate">
          {relativeDate(expense.date)} · {account?.label ?? PAYMENT_METHOD_LABELS[expense.paymentMethod]}
          {expense.notes ? ` · ${expense.notes}` : ''}
        </p>
      </div>
      <p className="text-white font-semibold text-[15px] shrink-0 tabular-nums">
        {formatCurrency(expense.amount)}
      </p>
      <span className="text-lg opacity-70 shrink-0">{PAYMENT_METHOD_ICONS[expense.paymentMethod]}</span>
    </motion.button>
  )
}
