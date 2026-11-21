import { getCurrency } from '../../lib/currency'

/**
 * A big amount with a light-weight decimal part, like $1,842.56. Whole currencies (such as rupees) show no decimals.
 * `className` sets the size and weight of the whole number; the cents are lighter and a little smaller.
 */
export function Money({ value, className, decimals }: { value: number; className?: string; decimals?: boolean }) {
  const c = getCurrency()
  const showDecimals = decimals ?? !c.wholeUnits
  const abs = Math.abs(value)
  const rounded = showDecimals ? Math.round(abs * 100) / 100 : Math.round(abs)
  const whole = Math.trunc(rounded)
  const cents = showDecimals ? String(Math.round((rounded - whole) * 100)).padStart(2, '0') : ''
  // Euros and many others write cents after a comma (€2.219,79), so use the currency's own separator.
  const point = new Intl.NumberFormat(c.locale).formatToParts(1.5).find((part) => part.type === 'decimal')?.value ?? '.'
  return (
    <span className={className}>
      {value < 0 ? '−' : ''}
      {c.symbol}
      {whole.toLocaleString(c.locale)}
      {showDecimals && <span style={{ fontWeight: 300, opacity: 0.55 }}>{point}{cents}</span>}
    </span>
  )
}
