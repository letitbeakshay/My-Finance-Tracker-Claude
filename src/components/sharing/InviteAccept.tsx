import { useEffect, useState } from 'react'
import { HeartHandshake, Users } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/button'
import { forgetInviteToken, sharing, type SharePerson, type ShareKind } from '../../lib/sharing'

interface Props {
  token: string
  onDone: (opened?: { id: string; name: string }) => void
}

/** Opened from an invite link: who it is from, what sharing means, and Accept / Not now. */
export function InviteAccept({ token, onDone }: Props) {
  const [info, setInfo] = useState<{ kind: ShareKind; status: string; from: SharePerson; for_me: boolean; invite_email: string } | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    sharing
      .inviteInfo(token)
      .then(setInfo)
      .catch(() => setInfo(null))
  }, [token])

  function close(opened?: { id: string; name: string }) {
    forgetInviteToken()
    onDone(opened)
  }

  async function accept() {
    if (!info || busy) return
    setBusy(true)
    setError('')
    try {
      await sharing.accept(token)
      close({ id: info.from.id, name: info.from.name })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept the invite.')
    } finally {
      setBusy(false)
    }
  }

  if (info === undefined) return null
  const Icon = info?.kind === 'couple' ? Users : HeartHandshake

  return (
    <BottomSheet open onClose={() => close()}>
      {!info ? (
        <>
          <h2 className="text-white text-[20px] font-bold mb-2">This invite has expired</h2>
          <p className="text-secondary text-[15px] mb-5">It may have been cancelled. Ask for a new invite.</p>
          <Button onClick={() => close()}>OK</Button>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center mb-4">
            <Icon size={26} />
          </div>
          <h2 className="text-white text-[20px] font-bold mb-2">
            {info.from.name} invited you {info.kind === 'couple' ? 'to share as a couple' : 'to be their accountability partner'}
          </h2>
          <p className="text-secondary text-[15px] mb-4">
            {info.kind === 'couple'
              ? `You will both see each other’s money, read-only: expenses, plan, loans and savings. Neither of you can change the other’s data.`
              : `You will see ${info.from.name}’s money, read-only, so you can encourage them. You cannot change anything, and they do not see yours.`}
          </p>
          {!info.for_me && (
            <p className="text-danger text-[14px] mb-4">
              This invite was sent to {info.invite_email}. Sign in with that email to accept it.
            </p>
          )}
          {error && <p className="text-danger text-[14px] mb-3">{error}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => close()}>
              Not now
            </Button>
            <Button onClick={accept} disabled={busy || !info.for_me || info.status === 'active'}>
              {info.status === 'active' ? 'Already accepted' : busy ? 'Accepting…' : 'Accept'}
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  )
}
