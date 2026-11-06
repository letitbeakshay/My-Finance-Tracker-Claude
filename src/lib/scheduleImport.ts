/**
 * Reads a lender's repayment (amortisation) schedule PDF into instalments.
 * Built for the PNB Housing Finance layout: Sr.No., Instrument Date, Rate Type, Instalment, Interest, Principal.
 * Everything happens on this device.
 */
import { format, parse } from 'date-fns'
import type { Installment } from '../types'

export interface ParsedSchedule {
  rows: Installment[]
  /** From the loan information box, when present. */
  interestRate?: number
  tenureMonths?: number
  sanctioned?: number
}

const AMOUNT = String.raw`(?:Rs\.?\s*)?([\d,]+\.\d{2})`
const ROW = new RegExp(String.raw`^(\d{1,4})\s+(\d{2})[-/](\d{2})[-/](\d{4})\s+(?:[A-Za-z]+\s+)?${AMOUNT}\s+${AMOUNT}\s+${AMOUNT}`)
const num = (s: string) => parseFloat(s.replace(/,/g, ''))

/** Turns the text lines of the PDF (one string per visual line) into instalments. */
export function parseScheduleLines(lines: string[]): ParsedSchedule {
  const rows: Installment[] = []
  for (const raw of lines) {
    const m = raw.trim().replace(/\s+/g, ' ').match(ROW)
    if (!m) continue
    const [emi, interest, principal] = [num(m[5]), num(m[6]), num(m[7])]
    if (!(emi > 0)) continue // the bank's zero-amount rows
    const date = format(parse(`${m[2]}-${m[3]}-${m[4]}`, 'dd-MM-yyyy', new Date()), 'yyyy-MM-dd')
    rows.push({ n: parseInt(m[1]), date, emi, interest, principal, paid: false })
  }
  const text = lines.join('\n')
  const rate = text.match(/Interest Rate[^\n\d]*([\d.]+)\s*%/i)
  const tenure = text.match(/tenure in months\s*(\d+)/i)
  const sanction = text.match(/Sanction Loan Amount\s*Rs\.?\s*([\d,]+)/i)
  return {
    rows: rows.sort((a, b) => a.n - b.n),
    interestRate: rate ? parseFloat(rate[1]) : undefined,
    tenureMonths: tenure ? parseInt(tenure[1]) : undefined,
    sanctioned: sanction ? num(sanction[1]) : undefined,
  }
}

/** Marks every instalment due on or before `today` as paid. */
export function markPaidUpTo(rows: Installment[], today: string): Installment[] {
  return rows.map((r) => ({ ...r, paid: !!r.date && r.date <= today }))
}

/** Reads the PDF in the browser and returns its schedule. Throws if it does not look like a schedule. */
export async function readSchedulePdf(file: File): Promise<ParsedSchedule> {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const lines: string[] = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    const items = content.items
      .filter((i): i is typeof i & { str: string; transform: number[] } => 'str' in i && !!(i as { str: string }).str.trim())
      .map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5] }))
    items.sort((a, b) => b.y - a.y || a.x - b.x)
    let current: typeof items = []
    const flush = () => {
      if (current.length) lines.push(current.sort((a, b) => a.x - b.x).map((i) => i.s).join(' '))
      current = []
    }
    for (const it of items) {
      if (current.length && Math.abs(current[0].y - it.y) > 3) flush()
      current.push(it)
    }
    flush()
  }
  const parsed = parseScheduleLines(lines)
  if (parsed.rows.length < 2) throw new Error('not a schedule')
  return parsed
}
