import { useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import clsx from 'clsx'
import { AlertCircle, Check, FileUp, Loader2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAllCategories, useExpenses, usePaymentAccounts } from '../../hooks/useLiveData'
import { expenseRepo, incomeRepo } from '../../db/repository'
import { buildTree } from '../../lib/categoryTree'
import { formatCurrency } from '../../lib/currency'
import {
  learnKey,
  loadImportedRefs,
  loadLearned,
  readStatementPdf,
  saveImportedRefs,
  saveLearned,
  suggestFor,
  type StatementTxn,
} from '../../lib/statementImport'
import type { ExpenseType } from '../../types'

interface Line {
  txn: StatementTxn
  include: boolean
  categoryId: string
  pleasesGod?: boolean
  type: ExpenseType
  /** Why it starts unticked: already in the app. */
  duplicate: boolean
}

const TYPES: { value: ExpenseType; label: string }[] = [
  { value: 'need', label: 'Need' },
  { value: 'want', label: 'Want' },
  { value: 'savings', label: 'Savings' },
  { value: 'giving', label: 'Giving' },
]

const SELECT =
  'h-11 w-full bg-card border border-border rounded-xl px-3 text-white text-[16px] md:text-[15px] md:h-10'

/** Pick a bank statement (PDF), review every transaction in a table, and add them all at once. */
export function StatementImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useAllCategories()
  const accounts = usePaymentAccounts()
  const expenses = useExpenses()
  const fileRef = useRef<HTMLInputElement>(null)
  const [lines, setLines] = useState<Line[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<number | null>(null)
  const [onlyTodo, setOnlyTodo] = useState(false)

  const bankAccounts = useMemo(() => (accounts ?? []).filter((a) => a.type === 'bank_account'), [accounts])
  const byId = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories])
  const choices = useMemo(
    () => buildTree((categories ?? []).filter((c) => !c.archived)).flatMap((n) => [n.category, ...n.children]),
    [categories],
  )

  useEffect(() => {
    if (!open) return
    setLines(null)
    setFileName('')
    setError('')
    setDone(null)
    setBusy(null)
    setOnlyTodo(false)
  }, [open])

  useEffect(() => {
    if (open && !accountId && bankAccounts.length) {
      setAccountId(bankAccounts.find((a) => /canara/i.test(`${a.label} ${a.bankName ?? ''}`))?.id ?? bankAccounts[0].id)
    }
  }, [open, accountId, bankAccounts])

  async function pick(file: File | undefined) {
    if (!file || !categories) return
    setBusy('reading')
    setError('')
    try {
      const { txns } = await readStatementPdf(file)
      if (!txns.length) throw new Error('empty')
      const learned = loadLearned()
      const seen = loadImportedRefs()
      const have = new Set((expenses ?? []).map((e) => `${e.date}|${Math.round(e.amount * 100)}`))
      setFileName(file.name)
      setLines(
        txns.map((t) => {
          const s = t.direction === 'debit' ? suggestFor(t, categories, learned) : undefined
          const cat = s ? byId.get(s.categoryId) : undefined
          const duplicate = (!!t.ref && seen.has(t.ref)) || (t.direction === 'debit' && have.has(`${t.date}|${Math.round(t.amount * 100)}`))
          return {
            txn: t,
            include: t.direction === 'debit' && !duplicate,
            categoryId: s?.categoryId ?? '',
            pleasesGod: s?.pleasesGod,
            type: s?.type ?? cat?.defaultType ?? 'need',
            duplicate,
          }
        }),
      )
    } catch {
      setError('I could not read transactions from that file. Use the PDF e-statement downloaded from your bank app.')
    } finally {
      setBusy(null)
    }
  }

  const patch = (i: number, p: Partial<Line>) => setLines((ls) => ls && ls.map((l, k) => (k === i ? { ...l, ...p } : l)))
  const setCategory = (i: number, categoryId: string) => patch(i, { categoryId, type: byId.get(categoryId)?.defaultType ?? lines![i].type })

  const incomplete = (l: Line) => l.include && l.txn.direction === 'debit' && (!l.categoryId || l.pleasesGod === undefined)
  const chosen = (lines ?? []).filter((l) => l.include)
  const missing = chosen.filter(incomplete).length
  const total = chosen.filter((l) => l.txn.direction === 'debit').reduce((s, l) => s + l.txn.amount, 0)

  async function save() {
    if (!lines || missing) return
    setBusy('saving')
    setError('')
    try {
      const learnedOut: Parameters<typeof saveLearned>[0] = []
      let n = 0
      for (const l of chosen) {
        const t = l.txn
        const notes = [t.name, t.note].filter(Boolean).join(' · ')
        if (t.direction === 'credit') {
          await incomeRepo.add({ amount: t.amount, source: t.name, accountId: accountId || undefined, date: t.date, notes: t.note || undefined })
        } else {
          await expenseRepo.add({
            amount: t.amount,
            categoryId: l.categoryId,
            type: l.type,
            paymentMethod: t.method,
            accountId: accountId || undefined,
            notes,
            pleasesGod: l.pleasesGod,
            reimbursed: byId.get(l.categoryId)?.reimbursable ? false : undefined,
            date: t.date,
            source: 'bank_sync',
          })
          learnedOut.push({ name: t.name, note: t.note, learned: { categoryId: l.categoryId, pleasesGod: l.pleasesGod, type: l.type } })
          // also remember the merchant on its own, so a different note still gets a good first guess
          if (t.note) learnedOut.push({ name: t.name, note: '', learned: { categoryId: l.categoryId, pleasesGod: l.pleasesGod, type: l.type } })
        }
        n++
      }
      saveLearned(learnedOut)
      saveImportedRefs(chosen.map((l) => l.txn.ref).filter(Boolean))
      void learnKey
      setDone(n)
    } catch {
      setError('Something went wrong while saving. Rows already saved will show as “already added” if you try again.')
    } finally {
      setBusy(null)
    }
  }

  if (!open) return null

  const visible = (lines ?? []).map((l, i) => ({ l, i })).filter(({ l }) => !onlyTodo || incomplete(l))

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-end md:items-center justify-center md:p-6" role="dialog" aria-label="Import bank statement">
      <div className="bg-bg w-full md:max-w-[1120px] h-[94dvh] md:h-[88dvh] rounded-t-sheet md:rounded-3xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="min-w-0">
            <h2 className="text-white text-[20px] font-bold">Import bank statement</h2>
            <p className="text-secondary text-[13px] mt-0.5">
              Read on this device only. Nothing is uploaded until you press Add.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-secondary shrink-0">
            <X size={18} />
          </button>
        </div>

        {done !== null ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-positive">
              <Check size={28} strokeWidth={2.6} />
            </div>
            <p className="text-white text-[18px] font-bold">Added {done} {done === 1 ? 'transaction' : 'transactions'}</p>
            <p className="text-secondary text-[14px] max-w-[360px]">I will remember your category choices, so next time most rows are filled in for you.</p>
            <Button onClick={onClose} className="!w-auto px-10">Done</Button>
          </div>
        ) : !lines ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
            <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-secondary">
              {busy === 'reading' ? <Loader2 className="animate-spin" size={26} /> : <FileUp size={26} />}
            </div>
            <p className="text-white text-[17px] font-semibold">{busy === 'reading' ? 'Reading your statement…' : 'Choose your bank statement PDF'}</p>
            <p className="text-secondary text-[14px] max-w-[380px]">
              Download the e-statement from your bank app (for example the last 10 days from Canara), then pick it here.
            </p>
            {error && <p className="text-danger text-[14px] max-w-[380px]">{error}</p>}
            <Button onClick={() => fileRef.current?.click()} disabled={busy !== null || !categories} className="!w-auto px-10">
              Choose PDF
            </Button>
          </div>
        ) : (
          <>
            <div className="px-5 pb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-secondary text-[13px] truncate max-w-full">{fileName} · {lines.length} transactions</p>
              {bankAccounts.length > 0 && (
                <label className="flex items-center gap-2 text-secondary text-[13px]">
                  Paid from
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-9 bg-card border border-border rounded-lg px-2 text-white text-[16px] md:text-[14px]">
                    {bankAccounts.map((a) => (<option key={a.id} value={a.id}>{a.label}</option>))}
                  </select>
                </label>
              )}
              <div className="flex flex-wrap gap-2 md:ml-auto">
                <button type="button" onClick={() => setOnlyTodo((v) => !v)} className={clsx('h-9 px-3 rounded-full border text-[13px] font-medium', onlyTodo ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}>
                  Needs my answer ({chosen.filter(incomplete).length})
                </button>
                <button type="button" onClick={() => setLines((ls) => ls && ls.map((l) => (l.txn.direction === 'debit' && l.include && l.pleasesGod === undefined ? { ...l, pleasesGod: true } : l)))} className="h-9 px-3 rounded-full border border-border bg-surface text-white text-[13px] font-medium">
                  Unanswered → Yes
                </button>
                <button type="button" onClick={() => setLines((ls) => ls && ls.map((l) => ({ ...l, include: l.txn.direction === 'debit' && !l.duplicate })))} className="h-9 px-3 rounded-full border border-border bg-surface text-white text-[13px] font-medium">
                  Select all spending
                </button>
              </div>
            </div>

            <div className="hidden md:grid grid-cols-[28px_64px_minmax(0,1fr)_100px_230px_132px_120px] gap-3 px-5 py-2 border-y border-border/60 text-tertiary text-[12px] font-semibold uppercase tracking-wide">
              <span /><span>Date</span><span>Details</span><span className="text-right">Amount</span><span>Category</span><span>Pleases God?</span><span>Type</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {visible.length === 0 && <p className="text-secondary text-center py-12 text-[14px]">Everything is answered.</p>}
              {visible.map(({ l, i }) => {
                const credit = l.txn.direction === 'credit'
                const flag = incomplete(l)
                return (
                  <div key={i} className={clsx('px-5 py-3 grid gap-2 md:gap-3 md:items-center md:grid-cols-[28px_64px_minmax(0,1fr)_100px_230px_132px_120px]', !l.include && 'opacity-55')}>
                    <div className="flex items-start gap-3 md:contents">
                      <input type="checkbox" checked={l.include} onChange={(e) => patch(i, { include: e.target.checked })} aria-label={`Include ${l.txn.name}`} className="w-5 h-5 mt-1 md:mt-0 accent-[var(--color-accent-ink)] shrink-0" />
                      <span className="hidden md:block text-secondary text-[14px]">{format(parseISO(l.txn.date), 'd MMM')}</span>
                      <div className="min-w-0 flex-1 md:flex-none">
                        <p className="text-white text-[15px] font-medium truncate">{l.txn.name}</p>
                        <p className="text-tertiary text-[12px] truncate">
                          <span className="md:hidden">{format(parseISO(l.txn.date), 'd MMM')} · </span>
                          {l.txn.note || (credit ? 'Money in' : l.txn.method === 'upi' ? 'UPI' : 'Bank')}
                          {l.duplicate && ' · maybe already added'}
                        </p>
                      </div>
                      <span className={clsx('text-[15px] font-bold tabular-nums md:text-right shrink-0', credit ? 'text-positive' : 'text-white')}>
                        {credit ? '+' : ''}{formatCurrency(l.txn.amount)}
                      </span>
                    </div>

                    {credit ? (
                      <p className="text-tertiary text-[13px] md:col-span-3 md:pl-0 pl-8">Money in: added to Income when ticked.</p>
                    ) : (
                      <>
                        <select value={l.categoryId} onChange={(e) => setCategory(i, e.target.value)} aria-label="Category" className={clsx(SELECT, flag && !l.categoryId && 'border-warning')}>
                          <option value="">Choose category</option>
                          {choices.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                        <div className="grid grid-cols-[1fr_110px] gap-1.5 md:contents">
                        <div className="grid grid-cols-2 gap-1.5">
                          {([true, false] as const).map((v) => (
                            <button key={String(v)} type="button" onClick={() => patch(i, { pleasesGod: v })} aria-pressed={l.pleasesGod === v}
                              className={clsx('h-11 md:h-10 rounded-xl border text-[14px] font-semibold flex items-center justify-center gap-1',
                                l.pleasesGod === v ? (v ? 'bg-positive/15 border-positive text-positive' : 'bg-danger/15 border-danger text-danger') : clsx('bg-surface text-white', flag && l.pleasesGod === undefined ? 'border-warning' : 'border-border'))}>
                              {v ? <Check size={14} strokeWidth={2.6} /> : <X size={14} strokeWidth={2.6} />}{v ? 'Yes' : 'No'}
                            </button>
                          ))}
                        </div>
                        <select value={l.type} onChange={(e) => patch(i, { type: e.target.value as ExpenseType })} aria-label="Type" className={SELECT}>
                          {TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                        </select>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="border-t border-border px-5 py-3 flex flex-col gap-2 md:flex-row md:items-center md:gap-4 bg-surface">
              <div className="flex-1 min-w-0">
                <p className="text-white text-[14px] font-semibold">{chosen.length} selected · {formatCurrency(total)} spending</p>
                {missing > 0 ? (
                  <p className="text-warning text-[12px] flex items-center gap-1"><AlertCircle size={13} /> {missing} still need a category and Yes/No</p>
                ) : error ? (
                  <p className="text-danger text-[12px]">{error}</p>
                ) : (
                  <p className="text-tertiary text-[12px]">Un-tick anything you do not want to add.</p>
                )}
              </div>
              <Button onClick={() => void save()} disabled={busy !== null || missing > 0 || chosen.length === 0} className="md:!w-auto md:px-10 !h-12">
                {busy === 'saving' ? 'Adding…' : `Add ${chosen.length} to my records`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
