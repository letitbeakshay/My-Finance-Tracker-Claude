import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { NewPaymentAccountSheet } from '../settings/NewPaymentAccountSheet'
import { paymentAccountRepo } from '../../db/repository'
import { Card } from '../ui/card'
import { Progress } from '../ui/progress'
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
  usedPct,
}: {
  icon: LucideIcon
  title: string
  sub?: string
  spent: number
  received?: number
  /** Share of a credit card's limit spent this month: a thin bar under the name. */
  usedPct?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
        <Icon size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[15px] truncate">{title}</p>
        {sub && <p className="text-tertiary text-[12px] truncate tabular-nums">{sub}</p>}
        {usedPct != null && (
          <Progress value={Math.min(100, usedPct)} height="h-1" className="mt-1.5 max-w-[160px]" indicatorColor={usedPct > 80 ? 'var(--color-danger)' : usedPct > 50 ? 'var(--color-warning)' : undefined} />
        )}
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
  const [addingBank, setAddingBank] = useState(false)
  const cards = summaries.filter((s) => s.account.type === 'credit_card')
  const debit = summaries.filter((s) => s.account.type === 'debit_card')
  const banks = summaries.filter((s) => s.account.type === 'bank_account')

  // One short line: the last digits and, for a card, when the bill is due. The rest is in the edit sheet.
  function sub(a: PaymentAccount) {
    const parts = [a.last4 ? `•• ${a.last4}` : a.bankName, a.type === 'credit_card' && a.dueDay ? `due ${a.dueDay}${ordinal(a.dueDay)}` : null]
    return parts.filter(Boolean).join(' · ') || undefined
  }

  function group(title: string, list: AccountSummary[], first = false) {
    if (!list.length) return null
    return (
      <>
        <p className={`text-tertiary text-[11px] font-semibold uppercase tracking-wider px-2${first ? '' : ' mt-3'} mb-0.5`}>{title}</p>
        {list.map((s) => (
          <button
            key={s.account.id}
            type="button"
            onClick={() => setEditing(s.account)}
            className="text-left w-full rounded-2xl px-2 py-2 hover:bg-surface/70 transition-colors duration-[var(--duration-quick)]"
            aria-label={`Edit ${s.account.label}`}
          >
            <Row
              icon={ACCOUNT_ICONS[s.account.type]}
              title={s.account.label}
              sub={sub(s.account)}
              spent={s.spent}
              received={s.received}
              usedPct={s.account.type === 'credit_card' && s.account.creditLimit ? (s.spent / s.account.creditLimit) * 100 : undefined}
            />
          </button>
        ))}
      </>
    )
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-white text-[16px] font-semibold">Cards & accounts</h2>
          <p className="text-tertiary text-[12px] mb-3">{monthLabel}</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="text-accent-ink text-[14px] font-semibold h-9 px-3.5 rounded-full bg-accent-soft shrink-0 transition-opacity duration-[var(--duration-quick)] hover:opacity-80">
          + Add
        </button>
      </div>

      <div className="flex flex-col -mx-2">
        {summaries.length === 0 && <p className="text-secondary text-[14px]">No cards or accounts yet. Tap Add to create one.</p>}
        {group('Credit cards', cards, true)}
        {group('Debit cards', debit, cards.length === 0)}
        {banks.length > 0 ? (
          group('Bank accounts', banks, cards.length + debit.length === 0)
        ) : (
          <div className="mx-2 rounded-2xl border border-dashed border-border p-4">
            <p className="text-white text-[15px] font-semibold">Add your bank accounts</p>
            <p className="text-tertiary text-[13px] mt-1 leading-relaxed">
              Then, when you pay by UPI, you can say which bank it came from instead of just “UPI”.
            </p>
            <button type="button" onClick={() => setAddingBank(true)} className="mt-3 h-10 px-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold">
              Add bank account
            </button>
          </div>
        )}
        <p className="text-tertiary text-[11px] font-semibold uppercase tracking-wider px-2 mt-3 mb-0.5">Not linked</p>
        <div className="px-2 py-2" title="Pick a bank when you add an expense to move it out of here">
          <Row icon={UNASSIGNED_ICON} title="Cash & UPI" sub="No bank picked" spent={unassignedSpend} />
        </div>
      </div>

      <NewPaymentAccountSheet open={adding} onClose={() => setAdding(false)} onSaved={() => setAdding(false)} />
      <NewPaymentAccountSheet open={addingBank} defaultType="bank_account" onClose={() => setAddingBank(false)} onSaved={() => setAddingBank(false)} />
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
