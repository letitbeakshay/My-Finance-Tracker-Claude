import { useState, type FormEvent, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label as FieldLabel } from '@/components/ui/label'
import {
  EMAIL_RE,
  changePassword,
  friendlyAuthError,
  passwordProblem,
  resendConfirmation,
  sendPasswordReset,
  signIn,
  signUp,
} from '../../lib/accounts'
import { APP_NAME } from '../../lib/config'
import { VERSES } from '../../lib/scripture'

type Mode = 'signin' | 'signup' | 'forgot'

const FIELD =
  'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary focus:border-accent outline-none transition-colors'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 fp-page z-[100] overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-center text-center mb-7">
            <img
              src={`${import.meta.env.BASE_URL}icon-192.png`}
              alt=""
              width={64}
              height={64}
              className="w-16 h-16 rounded-[18px] border border-border mb-4"
            />
            <h1 className="text-white text-[26px] font-bold leading-tight">{APP_NAME}</h1>
            <p className="text-secondary text-[15px] mt-1.5">Manage your money wisely, with a grateful heart.</p>
          </div>
          {children}
          <p className="text-tertiary text-[12px] italic text-center mt-7 leading-relaxed px-2">
            “{VERSES.lords.text}” — {VERSES.lords.ref}
          </p>
        </div>
      </div>
    </div>
  )
}

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <FieldLabel htmlFor={htmlFor} className="text-tertiary text-[13px] font-medium pl-1 mb-1.5 block">
      {children}
    </FieldLabel>
  )
}

function Notice({ tone, children }: { tone: 'error' | 'ok'; children: ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[14px] leading-snug"
      style={{
        color: tone === 'error' ? 'var(--color-danger)' : 'var(--color-positive)',
        background: `color-mix(in srgb, ${tone === 'error' ? 'var(--color-danger)' : 'var(--color-positive)'} 12%, transparent)`,
      }}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}

function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: 'current-password' | 'new-password'
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        className={`${FIELD} pr-14`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1.5 w-11 h-11 flex items-center justify-center text-tertiary"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={busy}>
      {busy ? (
        <>
          <Loader2 size={18} className="animate-spin" /> Please wait…
        </>
      ) : (
        children
      )}
    </Button>
  )
}

/**
 * An email link that is old or was already used brings the person back with an error in the address.
 * Say so in plain words, and start them on getting a new link.
 */
function linkProblemFromUrl() {
  const hash = location.hash.replace(/^#/, '')
  if (!hash.includes('error')) return null
  const params = new URLSearchParams(hash)
  const code = params.get('error_code') ?? ''
  try {
    history.replaceState(null, '', location.pathname + location.search)
  } catch {
    // Not important if the address cannot be tidied.
  }
  if (code === 'otp_expired' || /expired|invalid/i.test(params.get('error_description') ?? '')) {
    return 'That link has expired or was already used. Enter your email to get a new one.'
  }
  return 'That link did not work. Enter your email to get a new one.'
}

/** Sign in, create an account, or ask for a password-reset link. */
/** `invited`: they opened a sharing invite link; it is accepted once they are signed in. */
export function AuthScreen({ invited = false }: { invited?: boolean }) {
  const [linkProblem] = useState(linkProblemFromUrl)
  const [mode, setMode] = useState<Mode>(linkProblem ? 'forgot' : 'signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(linkProblem ?? '')
  const [info, setInfo] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)

  function switchTo(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
    setNeedsConfirm(false)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError('')
    setInfo('')
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.')
    if (mode !== 'forgot' && !password) return setError('Please enter your password.')
    if (mode === 'signup') {
      const problem = passwordProblem(password)
      if (problem) return setError(problem)
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else if (mode === 'signup') {
        const { signedIn } = await signUp({ email, password, name })
        if (!signedIn) {
          // The project asks people to confirm their email first.
          setNeedsConfirm(true)
          setInfo(`We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`)
          setMode('signin')
        }
      } else {
        await sendPasswordReset(email)
        setInfo('If there is an account with that email, we have sent a link to choose a new password. Check your inbox and spam folder.')
      }
    } catch (err) {
      const friendly = friendlyAuthError(err as { message?: string })
      setError(friendly)
      if (friendly.startsWith('Please confirm your email')) setNeedsConfirm(true)
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    try {
      await resendConfirmation(email)
      setInfo(`We sent the confirmation link to ${email.trim()} again.`)
      setError('')
    } catch (err) {
      setError(friendlyAuthError(err as { message?: string }))
    } finally {
      setBusy(false)
    }
  }

  const base = import.meta.env.BASE_URL

  return (
    <Shell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {invited && (
          <p className="mb-4 rounded-2xl bg-accent-soft text-accent-ink px-4 py-3 text-[14px] leading-snug">
            You have been invited to share. Sign in or create an account with the email the invite was sent to, and you can accept it straight after.
          </p>
        )}
        {mode !== 'forgot' && (
          <Tabs value={mode} onValueChange={(v) => switchTo(v as Mode)} className="mb-5">
            <TabsList className="w-full h-14">
              <TabsTrigger value="signin" className="text-[15px]">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="text-[15px]">Create account</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {mode === 'forgot' && (
          <div className="mb-5">
            <h2 className="text-white text-[20px] font-bold">Reset your password</h2>
            <p className="text-secondary text-[14px] mt-1">Enter your email and we will send you a link to choose a new one.</p>
          </div>
        )}

        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <Label htmlFor="name">Your name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="e.g. Priya"
                className={FIELD}
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="you@example.com"
              className={FIELD}
            />
          </div>
          {mode !== 'forgot' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordField
                id="password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'signup' ? 'At least 8 characters, letters and numbers' : 'Your password'}
              />
              {mode === 'signin' && (
                <button type="button" onClick={() => switchTo('forgot')} className="text-accent-ink text-[14px] font-medium mt-2.5 pl-1 h-9">
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {error && <Notice tone="error">{error}</Notice>}
          {info && <Notice tone="ok">{info}</Notice>}
          {needsConfirm && (
            <button type="button" onClick={resend} disabled={busy} className="text-accent-ink text-[14px] font-medium h-9 self-start pl-1">
              Send the confirmation email again
            </button>
          )}

          <Submit busy={busy}>
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create my account' : 'Send reset link'}
          </Submit>
        </form>

        {mode === 'forgot' && (
          <button type="button" onClick={() => switchTo('signin')} className="w-full text-secondary text-[14px] font-medium h-11 mt-2">
            Back to sign in
          </button>
        )}

        {mode === 'signup' && (
          <p className="text-tertiary text-[12px] text-center mt-4 leading-relaxed">
            By creating an account you agree to the{' '}
            <a href={`${base}?page=terms`} className="text-accent-ink underline">Terms</a> and the{' '}
            <a href={`${base}?page=privacy`} className="text-accent-ink underline">Privacy Policy</a>.
          </p>
        )}
        {mode === 'signin' && (
          <p className="text-tertiary text-[12px] text-center mt-4">
            <a href={`${base}?page=privacy`} className="underline">Privacy</a> · <a href={`${base}?page=terms`} className="underline">Terms</a>
          </p>
        )}
      </motion.div>
    </Shell>
  )
}

/** Shown after someone follows the link in a password-reset email: choose a new password. */
export function RecoveryScreen({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const problem = passwordProblem(password)
    if (problem) return setError(problem)
    if (password !== again) return setError('The two passwords do not match.')
    setBusy(true)
    setError('')
    try {
      await changePassword(password)
      onDone()
    } catch (err) {
      setError(friendlyAuthError(err as { message?: string }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <h2 className="text-white text-[20px] font-bold">Choose a new password</h2>
      <p className="text-secondary text-[14px] mt-1 mb-5">Then you will be signed in.</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div>
          <Label htmlFor="np">New password</Label>
          <PasswordField id="np" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters, letters and numbers" />
        </div>
        <div>
          <Label htmlFor="np2">Type it again</Label>
          <PasswordField id="np2" value={again} onChange={setAgain} autoComplete="new-password" placeholder="Repeat the password" />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Submit busy={busy}>Save and continue</Submit>
      </form>
    </Shell>
  )
}
