import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import { VERSES } from '../../lib/scripture'
import type { debtSummary } from '../../lib/stewardship'

export function DebtCard({ summary }: { summary: ReturnType<typeof debtSummary> }) {
  const debtFree = summary.owed <= 0

  return (
    <Card>
      <h2 className="text-white text-[17px] font-bold">Owe no one</h2>
      <p className="text-tertiary text-[12px] mb-4">Loans I have borrowed</p>

      {debtFree ? (
        <p className="text-positive text-[15px] font-medium">No outstanding debt. Praise God.</p>
      ) : (
        <>
          <p className="text-white text-[28px] font-bold tabular-nums leading-none mb-3">
            {formatCurrency(summary.owed)}
            <span className="text-tertiary text-[15px] font-medium"> still owed</span>
          </p>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
            <div className="h-full rounded-full bg-need" style={{ width: `${summary.paidPct}%` }} />
          </div>
          <p className="text-tertiary text-[12px]">
            {summary.paidPct}% repaid · {summary.count} open {summary.count === 1 ? 'loan' : 'loans'}
          </p>
        </>
      )}

      <p className="text-tertiary text-[12px] italic mt-4">
        “{VERSES.oweNoOne.text}” — {VERSES.oweNoOne.ref}
      </p>
    </Card>
  )
}
