import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { NewPaymentAccountSheet } from '../settings/NewPaymentAccountSheet'
import { paymentAccountRepo } from '../../db/repository'
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
  const [editing, setEditing] = useState<PaymentAccount | null>(null)
  const [adding, setAdding] = useState(false)
  const cards = summaries.filter((s) => s.account.type === 'credit_card')
  const debit = summaries.filter((s) => s.account.type === 'debit_card')
  const banks = summaries.filter((s) => s.account.type === 'bank_account')

  function sub(a: PaymentAccount) {
    const base = [a.bankName, a.last4 ? `•••• ${a.last4}` : null]
    const credit =
      a.type === 'credit_card'
        ? [
            a.interestRate != null ? `${a.interestRate}% a year` : null,
            a.creditLimit ? `limit ${formatCurrency(a.creditLimit)}` : null,
            a.dueDay ? `due on the ${a.dueDay}${ordinal(a.dueDay)}` : null,
          ]
        : []
    return [...base, ...credit].filter(Boolean).join(' · ') || undefined
  }

  function group(title: string, list: AccountSummary[], first = false) {
    if (!list.length) return null
    return (
      <>
        <p className={`text-secondary text-[12px] font-semibold uppercase tracking-wide${first ? '' : ' mt-1'}`}>{title}</p>
        {list.map((s) => (
          <button key={s.account.id} type="button" onClick={() => setEditing(s.account)} className="text-left w-full" aria-label={`Edit ${s.account.label}`}>
            <Row icon={ACCOUNT_ICONS[s.account.type]} title={s.account.label} sub={sub(s.account)} spent={s.spent} received={s.received} />
          </button>
        ))}
      </>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-white text-[19px] font-bold">Cards & accounts</h2>
          <p className="text-tertiary text-[12px] mb-4">{monthLabel} · tap one to edit or remove</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="text-accent-ink text-[14px] font-semibold h-9 px-3 rounded-full bg-accent-soft shrink-0">
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {summaries.length === 0 && <p className="text-secondary text-[14px]">No cards or accounts yet. Tap Add to create one.</p>}
        {group('Credit cards', cards, true)}
        {group('Debit cards', debit, cards.length === 0)}
        {group('Bank accounts', banks, cards.length + debit.length === 0)}
        <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide mt-1">Other</p>
        <Row icon={UNASSIGNED_ICON} title="UPI, cash & wallet" sub="No specific account" spent={unassignedSpend} />
      </div>

      <NewPaymentAccountSheet open={adding} onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />
      <NewPaymentAccountSheet
        open={!!editing}
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSaved={() => setEditing(null)}
        onDelete={async () => {
          if (editing) await paymentAccountRepo.remove(editing.id)
          setEditing(null)
        }}
      />
    </Card>
  )
}

function ordinal(n: number) {
  const r = n % 100
  if (r >= 11 && r <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10] ?? 'th'
}
