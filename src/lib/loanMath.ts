import { addMonths, format, parseISO } from 'date-fns'
import type { Installment, Loan } from '../types'

/** The monthly instalment for a loan: the standard EMI formula (zero interest just divides evenly). */
export function emiFor(principal: number, annualRatePercent: number, months: number) {
  if (principal <= 0 || months <= 0) return 0
  const i = annualRatePercent / 1200
  if (i === 0) return principal / months
  const f = Math.pow(1 + i, months)
  return (principal * i * f) / (f - 1)
}

type LoanLike = Pick<Loan, 'principal' | 'paid' | 'emi' | 'interestRate' | 'tenureMonths' | 'emisPaid' | 'nextDueDate'> & { schedule?: Installment[] }

/** A schedule worked out from the loan's own numbers: interest first each month, the rest of the EMI reduces what is owed. */
export function generateSchedule(loan: LoanLike): Installment[] {
  const i = (loan.interestRate ?? 0) / 1200
  const emi = loan.emi ?? (loan.tenureMonths ? emiFor(loan.principal, loan.interestRate ?? 0, loan.tenureMonths) : 0)
  if (!(emi > 0) || !(loan.principal > 0)) return []
  const k = loan.emisPaid ?? 0
  const rows: Installment[] = []
  let balance = loan.principal
  for (let n = 1; balance > 0.005 && n <= 1200; n++) {
    const interest = balance * i
    const pay = Math.min(emi, balance + interest)
    if (pay <= interest && i > 0) return [] // the EMI can never clear the loan
    const principal = pay - interest
    balance -= principal
    rows.push({
      n,
      date: loan.nextDueDate ? format(addMonths(parseISO(loan.nextDueDate), n - 1 - k), 'yyyy-MM-dd') : undefined,
      emi: Math.round(pay * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      paid: n <= k,
    })
  }
  return rows
}

/** The repayment schedule to show: the saved one (uploaded or ticked by hand), or one worked out from the loan's details. */
export function buildSchedule(loan: LoanLike): Installment[] {
  return loan.schedule?.length ? loan.schedule : generateSchedule(loan)
}

export interface LoanStats {
  /** True when there is a schedule (an EMI, or a rate with a tenure). */
  hasPlan: boolean
  emi: number
  emisPaid: number
  /** Total instalments in the loan (paid + remaining). */
  totalEmis?: number
  remainingEmis?: number
  outstanding: number
  principalPaid: number
  interestPaid: number
  totalPaid: number
  /** What is still to be paid in instalments, interest included. */
  remainingPayable?: number
  remainingInterest?: number
  totalInterest?: number
  payoffDate?: string // yyyy-MM-dd
}

const r2 = (n: number) => Math.round(n * 100) / 100
const sum = (rows: Installment[], pick: (r: Installment) => number) => rows.reduce((s, r) => s + pick(r), 0)

/** Works out where a loan stands from its schedule: what is paid, what is left, interest and when it clears. */
export function loanStats(loan: LoanLike): LoanStats {
  const rows = buildSchedule(loan)
  if (!rows.length) {
    return { hasPlan: false, emi: 0, emisPaid: loan.emisPaid ?? 0, outstanding: Math.max(0, loan.principal - loan.paid), principalPaid: loan.paid, interestPaid: 0, totalPaid: loan.paid }
  }
  const paid = rows.filter((r) => r.paid)
  const left = rows.filter((r) => !r.paid)
  const principalPaid = r2(sum(paid, (r) => r.principal))
  const emi = loan.emi ?? Math.max(...rows.map((r) => r.emi))
  const dated = rows.filter((r) => r.date)
  return {
    hasPlan: true,
    emi,
    emisPaid: paid.length,
    totalEmis: rows.length,
    remainingEmis: left.length,
    outstanding: Math.max(0, r2(loan.principal - principalPaid)),
    principalPaid,
    interestPaid: Math.round(sum(paid, (r) => r.interest)),
    totalPaid: Math.round(sum(paid, (r) => r.emi)),
    remainingPayable: Math.round(sum(left, (r) => r.emi)),
    remainingInterest: Math.round(sum(left, (r) => r.interest)),
    totalInterest: Math.round(sum(rows, (r) => r.interest)),
    payoffDate: dated.length ? dated[dated.length - 1].date : undefined,
  }
}

/** The balance still owed after each instalment, in order. */
export function runningBalances(principal: number, rows: Installment[]) {
  let b = principal
  return rows.map((r) => (b = Math.max(0, r2(b - r.principal))))
}
