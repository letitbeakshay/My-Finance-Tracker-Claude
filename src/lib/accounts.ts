import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

/** `?demo` on the dev server skips signing in and shows sample data. */
export const DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

export interface AuthState {
  /** True until we know whether someone is already signed in. */
  loading: boolean
  user: User | null
  /** True while the person arrived from a "reset my password" email and must choose a new password. */
  recovering: boolean
}

const DEMO_USER = { id: 'demo', email: 'demo@example.com', user_metadata: { name: 'Demo' } } as unknown as User

/** Who is signed in, kept up to date as people sign in, out or come back from a password-reset email. */
export function useAuth(): AuthState & { clearRecovery: () => void } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!DEMO)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (DEMO) return
    let live = true
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') setRecovering(false)
    })
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return {
    loading,
    user: DEMO ? DEMO_USER : (session?.user ?? null),
    recovering,
    clearRecovery: () => setRecovering(false),
  }
}

/** Turns the technical sign-in errors into something a person can act on. */
export function friendlyAuthError(error: { message?: string; status?: number; code?: string } | null | undefined) {
  const m = (error?.message ?? '').toLowerCase()
  const code = error?.code ?? ''
  if (error?.status === 429 || m.includes('rate limit') || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit')
    return 'Too many tries. Please wait a few minutes and try again.'
  if (m.includes('invalid login') || code === 'invalid_credentials') return 'That email or password is not right.'
  if (m.includes('already registered') || m.includes('already been registered') || code === 'user_already_exists' || code === 'email_exists')
    return 'There is already an account with this email. Try signing in instead.'
  if (m.includes('email not confirmed') || code === 'email_not_confirmed') return 'Please confirm your email first. Check your inbox for the link.'
  if (m.includes('password') && (m.includes('weak') || m.includes('at least') || code === 'weak_password'))
    return 'Choose a stronger password: at least 8 characters, with letters and numbers.'
  if (m.includes('valid email') || m.includes('invalid email') || code === 'email_address_invalid') return 'Please enter a valid email address.'
  if (m.includes('signups not allowed') || code === 'signup_disabled') return 'New sign-ups are paused right now. Please try again later.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'Could not reach the server. Check your internet and try again.'
  return 'Something went wrong. Please try again.'
}

export const MIN_PASSWORD = 8

/** Returns a message when the password is too weak, otherwise null. */
export function passwordProblem(password: string) {
  if (password.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Include both letters and numbers.'
  return null
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Where the links in emails (confirm email, reset password) bring the person back to. */
export const appUrl = () => `${location.origin}${location.pathname}`

export async function signUp(input: { email: string; password: string; name?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: input.name?.trim() ? { name: input.name.trim() } : {}, emailRedirectTo: appUrl() },
  })
  if (error) throw error
  // A fake "user" with no identities means the email is already registered (Supabase hides that on purpose).
  if (data.user && data.user.identities?.length === 0) throw { message: 'already registered', code: 'user_already_exists' }
  return { signedIn: !!data.session }
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw error
}

/** Things remembered on this device for the person who was signed in; the next person must not inherit them. */
function forgetThisPersonOnThisDevice() {
  try {
    const keep = new Set(['finance_tracker_theme', 'finance_tracker_nav_pinned'])
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('finance_tracker_') && !keep.has(key)) localStorage.removeItem(key)
    }
  } catch {
    // Storage blocked: there is nothing stored to clear.
  }
}

export async function signOut() {
  await supabase.auth.signOut()
  forgetThisPersonOnThisDevice()
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() })
  if (error) throw error
}

export async function changePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: appUrl() } })
  if (error) throw error
}

/** Permanently deletes the signed-in person's account and every record of theirs. */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await signOut()
}
