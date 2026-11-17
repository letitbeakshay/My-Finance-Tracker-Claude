import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { Download, FileText, Loader2, Share2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/button'
import { categoryBreakdown } from '../../lib/analytics'
import { formatCurrency } from '../../lib/currency'
import { APP_NAME } from '../../lib/config'
import { VERSES } from '../../lib/scripture'
import type { MonthPlan } from '../../lib/stewardship'
import type { Category, Expense } from '../../types'

interface ReportProps {
  month: Date
  plan: MonthPlan | null
  /** The month's own spending (reimbursable money left out). */
  expenses: Expense[]
  categories: Category[]
  owed: number
  name?: string
}

/** The card that is shared as a picture or printed as a PDF. Plain, self-contained styling so it looks the same everywhere. */
function ReportCard({ month, plan, expenses, categories, owed, name }: ReportProps) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const parents = new Map(categories.filter((c) => c.parentId).map((c) => [c.id, c.parentId!]))
  // Group sub-categories under their top-level category.
  const grouped = new Map<string, number>()
  for (const { categoryId, amount } of categoryBreakdown(expenses)) {
    const top = parents.get(categoryId) ?? categoryId
    grouped.set(top, (grouped.get(top) ?? 0) + amount)
  }
  const top = [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const spent = expenses.filter((e) => e.type === 'need' || e.type === 'want').reduce((s, e) => s + e.amount, 0)
  const total = top.reduce((s, [, a]) => s + a, 0) || 1
  const income = plan?.income ?? 0
  const net = income - spent

  const stat = (label: string, value: string, color?: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color }}>{value}</div>
    </div>
  )

  return (
    <div
      style={{
        width: 420,
        maxWidth: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        background: '#fff',
        color: '#1f2a22',
        fontFamily: 'Instrument Sans, system-ui, sans-serif',
        border: '1px solid #e3eadf',
      }}
    >
      <div style={{ padding: '24px 24px 28px', background: 'linear-gradient(160deg, #5f8f5f 0%, #86ac7d 55%, #c9dcc1 100%)', color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{APP_NAME}{name ? ` · ${name}` : ''}</div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{format(month, 'MMMM yyyy')}</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 18 }}>Kept this month</div>
        <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.1 }}>{formatCurrency(net)}</div>
      </div>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {stat('Income', formatCurrency(income), '#3f7a4a')}
          {stat('Spent', formatCurrency(spent))}
          {stat('Saved', formatCurrency(plan?.saved ?? 0), '#2f7f80')}
          {stat('Given', formatCurrency(plan?.given ?? 0), '#a47b22')}
        </div>
        {top.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.6, marginBottom: 10 }}>Where it went</div>
            {top.map(([id, amount]) => (
              <div key={id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                  <span>{byId.get(id)?.name ?? 'Other'}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: '#e8efe5', marginTop: 5 }}>
                  <div style={{ height: 6, borderRadius: 3, background: '#6f9b6a', width: `${Math.max(4, (amount / total) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {owed > 0 && (
          <div style={{ marginTop: 18, fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Loans still to clear</span>
            <strong>{formatCurrency(owed)}</strong>
          </div>
        )}
        <div style={{ marginTop: 22, fontSize: 12, fontStyle: 'italic', opacity: 0.6, lineHeight: 1.5 }}>
          “{VERSES.faithful.text}” — {VERSES.faithful.ref}
        </div>
      </div>
    </div>
  )
}

/** Share this month as a picture, or save it as a PDF. */
export function MonthReportSheet({ open, onClose, ...report }: ReportProps & { open: boolean; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileName = useMemo(() => `${APP_NAME.replace(/\s+/g, '-')}-${format(report.month, 'yyyy-MM')}.png`, [report.month])

  async function sharePicture() {
    if (!cardRef.current) return
    setBusy(true)
    setError('')
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${format(report.month, 'MMMM yyyy')} summary` })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = fileName
        a.click()
      }
    } catch (err) {
      // Closing the share menu is not an error.
      if ((err as Error)?.name !== 'AbortError') setError('Could not make the picture. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose}>
        <h2 className="text-white text-[20px] font-bold mb-1">Share this month</h2>
        <p className="text-secondary text-[14px] mb-4">A clean summary for your spouse, mentor or yourself.</p>
        <div className="overflow-x-auto pb-1 flex justify-center">
          <div ref={cardRef}>
            <ReportCard {...report} />
          </div>
        </div>
        {error && <p className="text-danger text-[14px] mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <Button onClick={sharePicture} disabled={busy}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : typeof navigator.share === 'function' ? <Share2 size={18} /> : <Download size={18} />}
            {typeof navigator.share === 'function' ? 'Share picture' : 'Save picture'}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FileText size={18} /> Save PDF
          </Button>
        </div>
      </BottomSheet>
      {open && createPortal(<div id="report-print"><ReportCard {...report} /></div>, document.body)}
    </>
  )
}
