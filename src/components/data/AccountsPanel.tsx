import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { ACCOUNT_ICONS, UNASSIGNED_ICON } from '../../lib/dataIcons'
import { formatCurrency } from '../../lib/currency'
import type { PaymentAccount } from '../../types'

export interface AccountSummary {
  account: PaymentAccount
  spent: number
  received: number
}

interface AccountsPanelProps {
  summaries: AccountSummary[]
  /** Spend this month with no specific account (UPI, cash, wallet…). */
  unassignedSpend: number
  monthLabel: string
}

function Row({
  icon: Icon,
  title,
  sub,
  spent,
  received,
}: {
  icon: LucideIcon
  title: string
  sub?: string
  spent: number
  received?: number
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
        <Icon size={20} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[15px] truncate">{title}</p>
        {sub && <p className="text-tertiary text-[12px] truncate">{sub}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-semibold text-[15px] tabular-nums">−{formatCurrency(spent)}</p>
        {!!received && (
          <p className="text-positive text-[12px] tabular-nums">+{formatCurrency(received)}</p>
        )}
      </div>
    </div>
  )
}

export function AccountsPanel({ summaries, unassignedSpend, monthLabel }: AccountsPanelProps) {
  const cards = summaries.filter((s) => s.account.type === 'credit_card')
  const banks = summaries.filter((s) => s.account.type === 'bank_account')

  function sub(a: PaymentAccount) {
    return [a.bankName, a.last4 ? `•••• ${a.last4}` : null].filter(Boolean).join(' · ') || undefined
  }

  return (
    <Card>
      <h2 className="text-white text-[19px] font-bold">Cards & accounts</h2>
      <p className="text-tertiary text-[12px] mb-4">{monthLabel}</p>

      <div className="flex flex-col gap-4">
        {cards.length > 0 && (
          <>
            <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide">Credit cards</p>
            {cards.map((s) => (
              <Row key={s.account.id} icon={ACCOUNT_ICONS[s.account.type]} title={s.account.label} sub={sub(s.account)} spent={s.spent} />
            ))}
          </>
        )}
        {banks.length > 0 && (
          <>
            <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide mt-1">Bank accounts</p>
            {banks.map((s) => (
              <Row
                key={s.account.id}
                icon={ACCOUNT_ICONS[s.account.type]}
                title={s.account.label}
                sub={sub(s.account)}
                spent={s.spent}
                received={s.received}
              />
            ))}
          </>
        )}
        <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide mt-1">Other</p>
        <Row icon={UNASSIGNED_ICON} title="UPI, cash & wallet" sub="No specific account" spent={unassignedSpend} />
      </div>
    </Card>
  )
}
