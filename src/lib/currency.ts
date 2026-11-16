export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  /** How numbers are grouped, e.g. 12,34,567 for India and 1,234,567 elsewhere. */
  locale: string
  /** Currencies where whole amounts are normal show no decimals unless needed. */
  wholeUnits: boolean
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', wholeUnits: true },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', wholeUnits: false },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', wholeUnits: false },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', wholeUnits: false },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', locale: 'en-AE', wholeUnits: false },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', locale: 'en-US', wholeUnits: false },
  { code: 'QAR', symbol: 'QAR ', name: 'Qatari Riyal', locale: 'en-US', wholeUnits: false },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', wholeUnits: false },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'en-MY', wholeUnits: false },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', wholeUnits: false },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', wholeUnits: false },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ', wholeUnits: false },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA', wholeUnits: false },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', wholeUnits: true },
  { code: 'LKR', symbol: 'Rs ', name: 'Sri Lankan Rupee', locale: 'en-LK', wholeUnits: true },
  { code: 'NPR', symbol: 'Rs ', name: 'Nepalese Rupee', locale: 'en-NP', wholeUnits: true },
  { code: 'PKR', symbol: 'Rs ', name: 'Pakistani Rupee', locale: 'en-PK', wholeUnits: true },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', locale: 'en-BD', wholeUnits: true },
]

const KEY = 'finance_tracker_currency'
const DEFAULT = CURRENCIES[0]

/** Finds a currency from a code ("USD") or a symbol saved by older versions ("₹"). */
export function findCurrency(codeOrSymbol?: string | null): CurrencyInfo {
  const v = (codeOrSymbol ?? '').trim()
  return CURRENCIES.find((c) => c.code === v.toUpperCase()) ?? CURRENCIES.find((c) => c.symbol.trim() === v) ?? DEFAULT
}

let current: CurrencyInfo = (() => {
  try {
    return findCurrency(localStorage.getItem(KEY))
  } catch {
    return DEFAULT
  }
})()

export const getCurrency = () => current

/** The money format used everywhere. Remembered on this device so the first screen already uses it. */
export function setCurrency(codeOrSymbol?: string | null) {
  current = findCurrency(codeOrSymbol)
  try {
    localStorage.setItem(KEY, current.code)
  } catch {
    // Remembering it is only a convenience.
  }
}

/** A sensible starting currency for someone new, from their phone's region. */
export function guessCurrency(): string {
  const region = (navigator.language || 'en-IN').split('-')[1]?.toUpperCase()
  const byRegion: Record<string, string> = {
    IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', SA: 'SAR', QA: 'QAR', SG: 'SGD', MY: 'MYR', AU: 'AUD', CA: 'CAD', NZ: 'NZD',
    ZA: 'ZAR', JP: 'JPY', LK: 'LKR', NP: 'NPR', PK: 'PKR', BD: 'BDT', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', IE: 'EUR',
  }
  return byRegion[region ?? ''] ?? 'INR'
}

function number(amount: number, c: CurrencyInfo) {
  const whole = c.wholeUnits || Number.isInteger(amount)
  return amount.toLocaleString(c.locale, whole ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** `symbol` overrides the chosen currency's symbol (kept so older call sites still work). */
export function formatCurrency(amount: number, symbol?: string) {
  const c = current
  const rounded = c.wholeUnits ? Math.round(amount) : Math.round(amount * 100) / 100
  const sign = rounded < 0 ? '-' : ''
  return `${sign}${symbol ?? c.symbol}${number(Math.abs(rounded), c)}`
}

export function formatCurrencyCompact(amount: number, symbol?: string) {
  const s = symbol ?? current.symbol
  if (current.code === 'INR') {
    if (amount >= 100000) return `${s}${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `${s}${(amount / 1000).toFixed(1)}k`
  } else {
    if (amount >= 1_000_000) return `${s}${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1000) return `${s}${(amount / 1000).toFixed(1)}k`
  }
  return formatCurrency(amount, symbol)
}
