import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAllPaymentAccounts } from '../../hooks/useLiveData'
import { paymentAccountRepo } from '../../db/repository'
import { NewPaymentAccountSheet } from './NewPaymentAccountSheet'
import type { PaymentAccount } from '../../types'

export function PaymentAccountManager() {
  const accounts = useAllPaymentAccounts()
  const [creating, setCreating] = useState(false)
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null)

  const active = (accounts ?? []).filter((a) => !a.archived)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-[17px] font-bold">Bank Accounts &amp; Cards</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="text-accent-ink text-[14px] font-semibold"
        >
          + Add
        </button>
      </div>

      {active.length === 0 ? (
        <p className="text-secondary text-[14px]">
          Add your bank accounts or credit cards to pick a specific one when logging an expense.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((a) => (
            <motion.div
              key={a.id}
              layout
              className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 h-14"
            >
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[15px] truncate">{a.label}</p>
                {(a.bankName || a.last4) && (
                  <p className="text-tertiary text-[12px] truncate">
                    {[a.bankName, a.last4 ? `•••• ${a.last4}` : null].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(a)}
                className="text-secondary text-[13px] font-medium px-2 shrink-0"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => paymentAccountRepo.remove(a.id)}
                className="text-danger text-[13px] font-medium px-2 shrink-0"
              >
                Delete
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <NewPaymentAccountSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => setCreating(false)}
      />
      <NewPaymentAccountSheet
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSaved={() => setEditingAccount(null)}
        initial={editingAccount ?? undefined}
      />
    </div>
  )
}
