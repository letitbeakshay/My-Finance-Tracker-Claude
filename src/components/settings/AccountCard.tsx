import { useState } from 'react'
import { format } from 'date-fns'
import { Check, Eye, EyeOff } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BottomSheet } from '../ui/BottomSheet'
import { useAuth, changePassword, deleteMyAccount, friendlyAuthError, passwordProblem, signOut } from '../../lib/accounts'
import { SUPPORT_EMAIL } from '../../lib/config'
import { dataRepo } from '../../db/repository'
import { downloadFile } from '../../lib/download'

const FIELD = 'w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary focus:border-accent outline-none'

/** Who is signed in, and the account actions: change password, sign out, delete the account. */
export function AccountCard({ onSignedOut }: { onSignedOut: () => void }) {
  const { user } = useAuth()
  const [pwOpen, setPwOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwDone, setPwDone] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [delError, setDelError] = useState('')

  const name = typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : ''
  const base = import.meta.env.BASE_URL

  function closePw() {
    setPwOpen(false)
    setPw('')
    setPw2('')
    setPwError('')
    setPwDone(false)
  }

  async function savePw() {
    const problem = passwordProblem(pw)
    if (problem) return setPwError(problem)
    if (pw !== pw2) return setPwError('The two passwords do not match.')
    setBusy(true)
    setPwError('')
    try {
      await changePassword(pw)
      setPwDone(true)
    } catch (err) {
      setPwError(friendlyAuthError(err as { message?: string }))
    } finally {
      setBusy(false)
    }
  }

  async function handleSignOut() {
    onSignedOut()
    await signOut()
  }

  async function handleDelete() {
    setBusy(true)
    setDelError('')
    try {
      // A copy of everything is saved to this device first, so nothing is lost by accident.
      const json = await dataRepo.exportJSON()
      downloadFile(json, `my-data-before-deleting-account-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
      await deleteMyAccount()
      onSignedOut()
    } catch {
      setDelError('Something went wrong, so your account was not deleted. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-3">Account</h3>
      <Card className="flex flex-col gap-4">
        <div>
          {name && <p className="text-white text-[16px] font-semibold">{name}</p>}
          <p className="text-secondary text-[14px] break-all">{user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setPwOpen(true)}>
            Change password
          </Button>
          <Button variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
          <a href={`${base}?page=privacy`} className="text-accent-ink underline">Privacy Policy</a>
          <a href={`${base}?page=terms`} className="text-accent-ink underline">Terms of Use</a>
          {SUPPORT_EMAIL && <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-ink underline">Contact us</a>}
        </div>
        <button type="button" onClick={() => setDelOpen(true)} className="text-danger text-[14px] font-medium text-left h-9">
          Delete my account
        </button>
      </Card>

      <BottomSheet open={pwOpen} onClose={closePw}>
        {pwDone ? (
          <>
            <div className="w-14 h-14 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center text-accent-ink mb-4">
              <Check size={28} strokeWidth={3} />
            </div>
            <h2 className="text-white text-[20px] font-bold mb-5">Password changed</h2>
            <Button onClick={closePw}>Done</Button>
          </>
        ) : (
          <>
            <h2 className="text-white text-[20px] font-bold mb-4">Change password</h2>
            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoComplete="new-password"
                  placeholder="New password (8+ characters, letters and numbers)"
                  className={`${FIELD} pr-14`}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1.5 w-11 h-11 flex items-center justify-center text-tertiary">
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <input type={showPw ? 'text' : 'password'} value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" placeholder="Type it again" className={FIELD} />
            </div>
            {pwError && <p className="text-danger text-[14px] mb-3">{pwError}</p>}
            <Button onClick={savePw} disabled={busy || !pw || !pw2}>
              Save new password
            </Button>
          </>
        )}
      </BottomSheet>

      <BottomSheet
        open={delOpen}
        onClose={() => {
          setDelOpen(false)
          setTyped('')
          setDelError('')
        }}
      >
        <h2 className="text-white text-[20px] font-bold mb-2">Delete your account?</h2>
        <p className="text-secondary text-[14px] mb-4 leading-relaxed">
          This permanently deletes your account and every expense, income, loan, budget, category and savings plan. It cannot be undone. A copy of your data is saved to this device first. To continue, type{' '}
          <span className="text-white font-semibold">DELETE</span>.
        </p>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type DELETE"
          autoCapitalize="characters"
          className={`${FIELD} mb-4`}
        />
        {delError && <p className="text-danger text-[14px] mb-3">{delError}</p>}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setDelOpen(false)
              setTyped('')
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={busy || typed.trim() !== 'DELETE'} className="bg-danger! text-onfill!">
            Delete my account
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
