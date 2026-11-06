const key = (method: string) => `finance_tracker_last_account_${method}`

/** The card or bank account last used with a payment method, so the next expense starts with it picked. */
export function lastAccountFor(method: string): string | null {
  try {
    return localStorage.getItem(key(method))
  } catch {
    return null
  }
}

export function rememberAccount(method: string, accountId: string | null | undefined) {
  try {
    if (accountId) localStorage.setItem(key(method), accountId)
  } catch {
    /* private mode: just do not remember */
  }
}
