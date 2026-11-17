import { Card } from '../ui/card'
import { Progress } from '@/components/ui/progress'
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
          <Progress value={Math.max(0, Math.min(100, summary.paidPct))} height="h-2" className="mb-2" />
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
