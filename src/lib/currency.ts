export function formatCurrency(amount: number, currency = '₹') {
  const rounded = Math.round(amount)
  return `${currency}${rounded.toLocaleString('en-IN')}`
}

export function formatCurrencyCompact(amount: number, currency = '₹') {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}k`
  return formatCurrency(amount, currency)
}
