/**
 * Reads a bank e-statement (PDF) and turns it into a list of transactions to review.
 * Everything happens on this device: the file is never uploaded anywhere.
 * Built for the Canara Bank e-passbook layout (Date, Particulars, Deposits, Withdrawals, Balance),
 * which many Indian bank statements resemble.
 */
import type { Category, ExpenseType, PaymentMethod } from '../types'

export interface TextItem {
  str: string
  x: number
  y: number
}

export interface StatementTxn {
  /** Bank's own reference number when there is one (used to avoid importing twice). */
  ref: string
  date: string // yyyy-MM-dd
  amount: number
  direction: 'debit' | 'credit'
  /** Who was paid / who paid, tidied up. */
  name: string
  /** What the payer typed in the UPI note, e.g. "Coffee". */
  note: string
  method: PaymentMethod
  raw: string
}

const DATE_RE = /^(\d{2})-(\d{2})-(\d{4})$/
const NUM_RE = /^[\d,]+\.\d{2}$/
const num = (s: string) => parseFloat(s.replace(/,/g, ''))

interface Row {
  y: number
  date: string
  numbers: { x: number; value: number }[]
  parts: TextItem[]
}

/** Groups the text of every page into rows (one per transaction). */
export function parsePages(pages: TextItem[][]): { txns: StatementTxn[]; opening?: number; closing?: number } {
  const rows: Row[] = []
  let opening: number | undefined
  let closing: number | undefined
  let depositsX = Infinity

  for (const items of pages) {
    const dep = items.find((i) => i.str.trim() === 'Deposits')
    if (dep) depositsX = dep.x
    const pageRows: Row[] = []
    for (const it of items) {
      const m = it.str.trim().match(DATE_RE)
      if (m && it.x < 140) pageRows.push({ y: it.y, date: `${m[3]}-${m[2]}-${m[1]}`, numbers: [], parts: [] })
    }
    const ob = items.find((i) => /^Opening Balance/i.test(i.str.trim()))
    if (ob) opening = items.filter((i) => Math.abs(i.y - ob.y) < 3 && NUM_RE.test(i.str.trim())).map((i) => num(i.str.trim()))[0]
    const cb = items.find((i) => /^Closing Balance/i.test(i.str.trim()))
    if (cb) closing = items.filter((i) => Math.abs(i.y - cb.y) < 3 && NUM_RE.test(i.str.trim())).map((i) => num(i.str.trim()))[0]

    for (const it of items) {
      const s = it.str.trim()
      if (!s || DATE_RE.test(s) || /^(Date|Particulars|Deposits|Withdrawals|Balance|Opening Balance|Closing Balance|page \d+)$/i.test(s)) continue
      if (/^Chq:/i.test(s)) continue
      const near = pageRows.reduce<Row | undefined>((best, r) => (!best || Math.abs(r.y - it.y) < Math.abs(best.y - it.y) ? r : best), undefined)
      if (!near || Math.abs(near.y - it.y) > 52) continue
      if (NUM_RE.test(s) && it.x >= depositsX - 40) near.numbers.push({ x: it.x, value: num(s) })
      else if (it.x < depositsX - 20 && it.x > 100) near.parts.push(it)
    }
    rows.push(...pageRows)
  }

  const txns: StatementTxn[] = []
  let prev = opening
  for (const r of rows) {
    if (r.numbers.length < 2) continue
    const sorted = [...r.numbers].sort((a, b) => a.x - b.x)
    const balance = sorted[sorted.length - 1].value
    const amount = sorted[0].value
    let direction: 'debit' | 'credit'
    if (prev !== undefined && Math.abs(Math.abs(balance - prev) - amount) < 0.011) direction = balance > prev ? 'credit' : 'debit'
    else direction = sorted[0].x < (depositsX + 60) ? 'credit' : 'debit'
    prev = balance
    const lines = [...r.parts].sort((a, b) => b.y - a.y || a.x - b.x).map((p) => p.str.trim())
    const raw = lines.join(/^(UPI|INET|MOB)/i.test(lines[0] ?? '') ? '' : ' ').replace(/\s+/g, ' ').trim()
    txns.push({ ...describe(raw), date: r.date, amount, direction, raw })
  }
  return { txns, opening, closing }
}

const GENERIC_NOTE = /^(NOREMARKS|NAVI|NAVIUPI|UPI|PAYMENT|PAID ?VIA|PAID|AUTO|NAVIUPI|PAYMENTUPI)?$/i

function title(s: string) {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim()
}

function describe(raw: string): Pick<StatementTxn, 'ref' | 'name' | 'note' | 'method'> {
  const parts = raw.split('/')
  if (/^UPI$/i.test(parts[0])) {
    let note = (parts[6] ?? '').trim()
    note = note.replace(/^NAVI/i, '')
    if (GENERIC_NOTE.test(note) || /\d{8,}/.test(note) || note.length > 24) note = ''
    return { ref: parts[2] ?? '', name: title(parts[3] ?? 'UPI payment'), note: title(note), method: 'upi' }
  }
  if (/IMPS|NEFT|RTGS/i.test(parts[0])) {
    return { ref: parts.at(-1) ?? '', name: title(parts[1] ?? parts[0]), note: '', method: 'bank_transfer' }
  }
  const words = raw.split(' ')
  return { ref: '', name: title(words.slice(0, 2).join(' ')), note: '', method: 'bank_transfer' }
}

/** Reads the PDF in the browser and returns its transactions. Throws if it does not look like a statement. */
export async function readStatementPdf(file: File) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages: TextItem[][] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    pages.push(
      content.items
        .filter((i): i is typeof i & { str: string; transform: number[] } => 'str' in i)
        .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] })),
    )
  }
  return parsePages(pages)
}

/** A first guess at the category from the merchant and note. Rules only; learned choices override them. */
const RULES: { test: RegExp; category: string }[] = [
  { test: /coffee|cafe|brew|breadb|\btea\b|indcost|juice|bun\b/, category: 'Coffee' },
  { test: /snack|bajji|bakery|puff|chaat/, category: 'Snacks' },
  { test: /dinner|lunch|breakfast|grill|biryani|restaurant|hotel|meal|food|kaalan|mess|tiffin/, category: 'Outside Meal' },
  { test: /petrol|fuel|oxygen|\boil\b|bunk/, category: 'Fuel' },
  { test: /milk|egg|grocery|vegetable|fruit|supermarket|provision/, category: 'Grocery' },
  { test: /recharge|jio|airtel|vodafone|google ?in|euronet/, category: 'Recharge' },
  { test: /hospi|medical|pharm|clinic|doctor/, category: 'Medical' },
  { test: /\bemi\b|nach|loan|housingfin|hdfcbank/, category: 'EMI' },
  { test: /rent/, category: 'Rent' },
  { test: /cred club|credit card/, category: 'Bills' },
  { test: /max retail|retail|mart\b|shopping|tshirt|t-shirt/, category: 'Shopping' },
  { test: /parking|trip|travel|uber|ola\b|redbus|irctc/, category: 'Travel' },
]

export interface Learned {
  categoryId: string
  pleasesGod?: boolean
  type?: ExpenseType
}

const MAP_KEY = 'finance_tracker_merchant_map'
const REFS_KEY = 'finance_tracker_imported_refs'

const key = (name: string, note: string) => `${name}|${note}`.toLowerCase()

export function loadLearned(): Record<string, Learned> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveLearned(entries: { name: string; note: string; learned: Learned }[]) {
  try {
    const map = loadLearned()
    for (const e of entries) map[key(e.name, e.note)] = e.learned
    localStorage.setItem(MAP_KEY, JSON.stringify(map))
  } catch {
    /* private mode: just do not remember */
  }
}

export function loadImportedRefs(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(REFS_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function saveImportedRefs(refs: string[]) {
  try {
    localStorage.setItem(REFS_KEY, JSON.stringify([...new Set([...loadImportedRefs(), ...refs])]))
  } catch {
    /* ignore */
  }
}

export function suggestFor(t: StatementTxn, categories: Category[], learned: Record<string, Learned>): Learned | undefined {
  const known = learned[key(t.name, t.note)] ?? learned[key(t.name, '')]
  if (known && categories.some((c) => c.id === known.categoryId)) return known
  const text = `${t.name} ${t.note} ${t.raw}`.toLowerCase()
  const rule = RULES.find((r) => r.test.test(text))
  const cat = rule && categories.find((c) => !c.archived && c.name.toLowerCase() === rule.category.toLowerCase())
  return cat ? { categoryId: cat.id } : undefined
}
export const learnKey = key
