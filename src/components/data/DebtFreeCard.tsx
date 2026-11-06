import { format, parseISO } from 'date-fns'
import { HandHeart } from 'lucide-react'
import { VERSES } from '../../lib/scripture'
import { formatCurrency } from '../../lib/currency'
import type { LoanStats } from '../../lib/loanMath'
import type { Loan } from '../../types'

interface Row {
  loan: Loan
  stats: LoanStats
}

/** Scripture on debt, where the user stands, and practical ways to become debt-free sooner. */
export function DebtFreeCard({ open }: { open: Row[] }) {
  if (!open.length) return null
  const owed = open.reduce((s, r) => s + r.stats.outstanding, 0)
  const monthly = open.reduce((s, r) => s + r.stats.emi, 0)
  const interestLeft = open.reduce((s, r) => s + (r.stats.remainingInterest ?? 0), 0)
  const clears = open.map((r) => r.stats.payoffDate).filter((d): d is string => !!d).sort().at(-1)
  const dearest = [...open].filter((r) => (r.loan.interestRate ?? 0) > 0).sort((a, b) => (b.loan.interestRate ?? 0) - (a.loan.interestRate ?? 0))[0]
  const first = [...open].sort((a, b) => a.stats.outstanding - b.stats.outstanding)[0]

  const tips = [
    first && first.stats.emi > 0
      ? `Pay the minimum on every loan, and put every spare rupee on ${first.loan.name}. When it is cleared, add its ${formatCurrency(Math.round(first.stats.emi))} a month to the next one. This is the snowball, and each win keeps you going.`
      : 'Pay the minimum on every loan and put every spare rupee on the smallest one. When it is cleared, roll its EMI into the next.',
    dearest && (dearest.loan.interestRate ?? 0) >= 15
      ? `${dearest.loan.name} costs you ${dearest.loan.interestRate}% a year, the most of all. If you can, pay a little extra there too, or close it early: a card EMI usually charges a small foreclosure fee, so ask the bank first.`
      : 'Ask each lender what it costs to close early. A small fee is often far less than the interest you save.',
    'Give the first part to God and keep to your plan; then send every bonus, refund, gift or one-off income straight to the loan before it gets spent.',
    'Do not take new EMIs or card balances while you are paying these off. Each new one pushes your debt-free day further away.',
    'Trim the “want” spending you do not miss (eating out, shopping) and add that amount to the loan each month. Even a small, steady extra shortens the loan by months.',
    'Keep a small emergency fund so a surprise bill does not push you back onto a card.',
  ]

  return (
    <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
      <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide flex items-center gap-1.5">
        <HandHeart size={15} /> Becoming debt-free
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {[VERSES.oweNoOne, VERSES.borrower].map((v) => (
          <p key={v.ref} className="text-secondary text-[13px] italic leading-relaxed">
            “{v.text}” <span className="not-italic text-tertiary">— {v.ref}</span>
          </p>
        ))}
      </div>
      <p className="text-white text-[14px] leading-relaxed mt-3">
        Scripture warns us about debt and calls us to pay what we owe. This is not about shame: it is about being free to give, serve and trust God with your whole income.
      </p>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-xl bg-card border border-border px-3 py-2.5">
          <p className="text-tertiary text-[11px] font-medium">Still owed</p>
          <p className="text-white text-[16px] font-bold tabular-nums mt-0.5">{formatCurrency(Math.round(owed))}</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-3 py-2.5">
          <p className="text-tertiary text-[11px] font-medium">EMIs each month</p>
          <p className="text-white text-[16px] font-bold tabular-nums mt-0.5">{formatCurrency(Math.round(monthly))}</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-3 py-2.5">
          <p className="text-tertiary text-[11px] font-medium">Interest still to pay</p>
          <p className="text-white text-[16px] font-bold tabular-nums mt-0.5">{formatCurrency(interestLeft)}</p>
        </div>
        <div className="rounded-xl bg-card border border-border px-3 py-2.5">
          <p className="text-tertiary text-[11px] font-medium">Debt-free by</p>
          <p className="text-white text-[16px] font-bold mt-0.5">{clears ? format(parseISO(clears), 'MMM yyyy') : '—'}</p>
        </div>
      </div>

      <p className="text-secondary text-[12px] font-semibold uppercase tracking-wide mt-5 mb-2">Ways to close them sooner</p>
      <ol className="flex flex-col gap-2.5">
        {tips.map((t, i) => (
          <li key={i} className="flex gap-3 text-white text-[14px] leading-relaxed">
            <span className="w-6 h-6 rounded-full bg-accent-soft text-accent-ink text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
