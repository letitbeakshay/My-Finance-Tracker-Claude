import { addMonths, format, parseISO } from 'date-fns'
import type { Loan } from '../types'

/** The monthly instalment for a loan: the standard EMI formula (zero interest just divides evenly). */
export function emiFor(principal: number, annualRatePercent: number, months: number) {
  if (principal <= 0 || months <= 0) return 0
  const i = annualRatePercent / 1200
  if (i === 0) return principal / months
  const f = Math.pow(1 + i, months)
  return (principal * i * f) / (f - 1)
}

export interface LoanStats {
  /** True when there is enough to work out interest and months (an EMI, or a rate with a tenure). */
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

/** Works out where a loan stands from its amount, rate, EMI and how many EMIs are paid. */
export function loanStats(loan: Pick<Loan, 'principal' | 'paid' | 'emi' | 'interestRate' | 'tenureMonths' | 'emisPaid' | 'nextDueDate'>): LoanStats {
  const rate = loan.interestRate ?? 0
  const i = rate / 1200
  const emi = loan.emi ?? (loan.tenureMonths ? emiFor(loan.principal, rate, loan.tenureMonths) : 0)
  const k = loan.emisPaid ?? 0
  if (!(emi > 0)) {
    return { hasPlan: false, emi: 0, emisPaid: k, outstanding: Math.max(0, loan.principal - loan.paid), principalPaid: loan.paid, interestPaid: 0, totalPaid: loan.paid }
  }

  // Walk the loan month by month: interest first, the rest of the EMI reduces what is owed.
  let balance = loan.principal
  let interestPaid = 0
  for (let m = 0; m < k && balance > 0.005; m++) {
    const interest = balance * i
    const pay = Math.min(emi, balance + interest)
    interestPaid += interest
    balance = balance + interest - pay
  }
  const outstanding = Math.max(0, Math.round(balance * 100) / 100)

  let remaining = 0
  let futureInterest = 0
  let futurePay = 0
  let b = balance
  while (b > 0.005 && remaining < 1200) {
    const interest = b * i
    const pay = Math.min(emi, b + interest)
    if (pay <= interest && i > 0) break // EMI too small to ever clear the loan
    futureInterest += interest
    futurePay += pay
    b = b + interest - pay
    remaining++
  }
  const cleared = b <= 0.005
  const payoffDate =
    cleared && loan.nextDueDate && remaining > 0 ? format(addMonths(parseISO(loan.nextDueDate), remaining - 1), 'yyyy-MM-dd') : undefined

  return {
    hasPlan: true,
    emi,
    emisPaid: k,
    totalEmis: cleared ? k + remaining : undefined,
    remainingEmis: cleared ? remaining : undefined,
    outstanding,
    principalPaid: Math.round((loan.principal - outstanding) * 100) / 100,
    interestPaid: Math.round(interestPaid),
    totalPaid: Math.round(k * emi),
    remainingPayable: cleared ? Math.round(futurePay) : undefined,
    remainingInterest: cleared ? Math.round(futureInterest) : undefined,
    totalInterest: cleared ? Math.round(interestPaid + futureInterest) : undefined,
    payoffDate,
  }
}
