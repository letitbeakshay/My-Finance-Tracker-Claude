import { supabase } from './supabaseClient'
import { findCurrency } from './currency'

/**
 * Sharing with a couple partner (both see each other's money, read-only) or an accountability partner
 * (they see everything of yours, read-only; one way). All of it goes through database functions that check who is asking;
 * the app's own screens keep reading only the signed-in person's data.
 */
export type ShareKind = 'couple' | 'accountability'

export interface SharePerson {
  id: string
  email: string
  name: string
}

export interface Share {
  id: number
  kind: ShareKind
  status: 'pending' | 'active'
  /** owner: you invited them. viewer: they share with you. invited: an invite waiting for you. */
  role: 'owner' | 'viewer' | 'invited'
  invite_email: string
  token: string | null
  link: string | null
  other: SharePerson | null
  created_at: string
}

export interface SharedSummary {
  person: SharePerson
  month: string
  currency: string | null
  giving_percent: number | null
  saving_percent: number | null
  income: number
  spent: number
  by_type: Partial<Record<'need' | 'want' | 'giving' | 'savings', number>>
  categories: { name: string; icon: string; total: number }[]
  plan: { name: string; amount: number; spent: number }[]
  level: 'summary' | 'full'
}

export interface SharedFull {
  person: SharePerson
  categories: { id: string; name: string; icon: string; parent_id: string | null }[]
  payment_accounts: { id: string; label: string }[]
  expenses: { id: string; amount: number; category_id: string; type: string; payment_method: string; account_id: string | null; notes: string | null; date: string }[]
  incomes: { id: string; amount: number; source: string; date: string }[]
  loans: { id: string; name: string; kind: string; principal: number; paid: number; emi: number | null; next_due_date: string | null; closed: boolean }[]
  savings_plans: { id: string; name: string; target: number | null; opening: number; monthly: number | null; closed: boolean }[]
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message || 'Something went wrong. Please try again.')
  return data as T
}

export const sharing = {
  list: () => call<Share[]>('my_shares'),
  invite: (email: string, kind: ShareKind) => call<{ id: number; status: 'sent' | 'saved'; link: string }>('invite_share', { p_email: email, p_kind: kind }),
  inviteInfo: (token: string) => call<{ kind: ShareKind; status: string; from: SharePerson; for_me: boolean; invite_email: string } | null>('share_invite_info', { p_token: token }),
  accept: (token: string) => call<ShareKind>('accept_share', { p_token: token }),
  remove: (id: number) => call<void>('remove_share', { p_id: id }),
  summary: (owner: string, month: string) => call<SharedSummary>('shared_summary', { p_owner: owner, p_month: month }),
  full: (owner: string) => call<SharedFull>('shared_full', { p_owner: owner }),
}

// ---- an invite link opened before signing in is remembered until it is dealt with ----
const INVITE_KEY = 'fp_share_invite'

/** Reads ?invite=… from the address (and tidies it away), or a remembered one. */
export function takeInviteToken(): string | null {
  const url = new URL(location.href)
  const fromUrl = url.searchParams.get('invite')
  if (fromUrl) {
    try {
      localStorage.setItem(INVITE_KEY, fromUrl)
    } catch {
      /* private mode: still works for this visit */
    }
    url.searchParams.delete('invite')
    history.replaceState(null, '', url.pathname + url.search + url.hash)
    return fromUrl
  }
  try {
    return localStorage.getItem(INVITE_KEY)
  } catch {
    return null
  }
}

export function forgetInviteToken() {
  try {
    localStorage.removeItem(INVITE_KEY)
  } catch {
    /* ignore */
  }
}

export const KIND_LABEL: Record<ShareKind, string> = {
  couple: 'Couple',
  accountability: 'Accountability partner',
}

/** Money in the other person's own currency (it can differ from yours). */
export function formatIn(code: string | null | undefined, amount: number) {
  const c = findCurrency(code)
  const digits = c.wholeUnits ? 0 : 2
  const n = Math.abs(amount).toLocaleString(c.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${amount < 0 ? '−' : ''}${c.symbol}${n}`
}
