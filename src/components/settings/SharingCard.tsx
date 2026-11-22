import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Eye, HeartHandshake, Mail, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { BottomSheet } from '../ui/BottomSheet'
import { DEMO } from '../../lib/accounts'
import { KIND_LABEL, sharing, type Share, type ShareKind } from '../../lib/sharing'

const ABOUT: Record<ShareKind, { title: string; text: string; icon: typeof Users }> = {
  couple: {
    title: 'Your spouse or partner',
    text: 'You both see each other’s money, read-only: expenses, plan, loans and savings. Neither of you can change the other’s data.',
    icon: Users,
  },
  accountability: {
    title: 'Accountability partner',
    text: 'A trusted friend sees all your money, read-only, so they can encourage you. They cannot change anything, and you do not see theirs.',
    icon: HeartHandshake,
  },
}

interface Props {
  /** Open someone's shared money (read-only). */
  onView: (person: { id: string; name: string }) => void
}

/** Settings: invite a spouse or an accountability partner, see who you share with, accept invites. */
export function SharingCard({ onView }: Props) {
  const [shares, setShares] = useState<Share[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [inviting, setInviting] = useState<ShareKind | null>(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ status: 'sent' | 'saved'; link: string; email: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<Share | null>(null)

  const load = useCallback(async () => {
    if (DEMO) return setShares([])
    try {
      setShares(await sharing.list())
      setLoadError('')
    } catch {
      setLoadError('Could not load your sharing. Please check your connection.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openInvite(kind: ShareKind) {
    setInviting(kind)
    setEmail('')
    setError('')
    setResult(null)
    setCopied(false)
  }

  async function sendInvite() {
    if (!inviting || busy) return
    setBusy(true)
    setError('')
    try {
      const r = await sharing.invite(email, inviting)
      setResult({ status: r.status, link: r.link, email: email.trim() })
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the invite.')
    } finally {
      setBusy(false)
    }
  }

  async function copy(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the link is still shown */
    }
  }

  async function accept(s: Share) {
    if (!s.token) return
    try {
      await sharing.accept(s.token)
      await load()
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not accept the invite.')
    }
  }

  async function remove(s: Share) {
    try {
      await sharing.remove(s.id)
      setConfirmRemove(null)
      await load()
    } catch {
      setLoadError('Could not remove it. Please try again.')
    }
  }

  const invites = (shares ?? []).filter((s) => s.role === 'invited')
  const sharedWithMe = (shares ?? []).filter((s) => s.status === 'active' && (s.role === 'viewer' || s.kind === 'couple'))
  const mine = (kind: ShareKind) => (shares ?? []).filter((s) => s.role === 'owner' && s.kind === kind)
  const coupleActive = (shares ?? []).some((s) => s.kind === 'couple' && s.status === 'active')
  const nameOf = (s: Share) => s.other?.name || s.invite_email

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-3">Sharing</h3>
      <div className="flex flex-col gap-3">
        {invites.map((s) => (
          <Card key={s.id} className="flex flex-col gap-3 border-accent/60">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                <Mail size={20} />
              </span>
              <p className="flex-1 text-[15px] leading-snug">
                <b>{s.other?.name ?? 'Someone'}</b> invited you as {s.kind === 'couple' ? 'their spouse or partner' : 'their accountability partner'}.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="!h-11 !text-[15px]" onClick={() => remove(s)}>
                Decline
              </Button>
              <Button className="!h-11 !text-[15px]" onClick={() => accept(s)}>
                Accept
              </Button>
            </div>
          </Card>
        ))}

        {sharedWithMe.length > 0 && (
          <Card className="flex flex-col gap-1">
            <p className="text-secondary text-[13px] font-semibold uppercase tracking-wide mb-1">Shared with you</p>
            {sharedWithMe.map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2">
                <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-accent-ink shrink-0">
                  {(nameOf(s)[0] ?? '?').toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate">{nameOf(s)}</p>
                  <p className="text-tertiary text-[13px]">{s.kind === 'couple' ? 'Couple · read-only, both ways' : 'Accountability · everything, read-only'}</p>
                </div>
                {s.other && (
                  <Button variant="secondary" className="!w-auto !h-10 px-4 !text-[14px]" onClick={() => onView({ id: s.other!.id, name: nameOf(s) })}>
                    <Eye size={16} /> View
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}

        {(['couple', 'accountability'] as ShareKind[]).map((kind) => {
          const about = ABOUT[kind]
          const Icon = about.icon
          const list = mine(kind)
          return (
            <Card key={kind} className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </span>
                <div className="flex-1">
                  <p className="text-[16px] font-semibold">{about.title}</p>
                  <p className="text-secondary text-[14px] leading-snug mt-0.5">{about.text}</p>
                </div>
              </div>
              {list.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate">{nameOf(s)}</p>
                    <p className="text-tertiary text-[13px]">{s.status === 'active' ? 'Sharing now' : 'Invite sent · waiting'}</p>
                  </div>
                  {s.status === 'pending' && s.link && (
                    <button type="button" onClick={() => copy(s.link!)} className="text-accent-ink text-[14px] font-semibold px-2 h-9" aria-label="Copy invite link">
                      <Copy size={16} />
                    </button>
                  )}
                  <button type="button" onClick={() => setConfirmRemove(s)} className="text-danger text-[14px] font-semibold px-2 h-9">
                    {s.status === 'active' ? 'Stop' : 'Cancel'}
                  </button>
                </div>
              ))}
              {!(kind === 'couple' && coupleActive) && (
                <Button variant="secondary" className="!h-11 !text-[15px]" onClick={() => openInvite(kind)}>
                  {kind === 'couple' ? 'Invite your spouse or partner' : 'Invite an accountability partner'}
                </Button>
              )}
            </Card>
          )
        })}
        {loadError && <p className="text-danger text-[14px]">{loadError}</p>}
      </div>

      <BottomSheet open={inviting !== null} onClose={() => setInviting(null)}>
        {result ? (
          <>
            <div className="w-14 h-14 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center text-accent-ink mb-4">
              <Check size={28} strokeWidth={3} />
            </div>
            <h2 className="text-white text-[20px] font-bold mb-1">{result.status === 'sent' ? 'Invite sent' : 'Invite ready'}</h2>
            <p className="text-secondary text-[15px] mb-4">
              {result.status === 'sent'
                ? `We emailed ${result.email}. They accept by signing in with that email.`
                : `Send this link to ${result.email}. They accept by signing in with that email.`}
            </p>
            <div className="flex items-center gap-2 rounded-2xl bg-surface border border-border px-3 py-2 mb-4">
              <span className="flex-1 text-[13px] text-secondary truncate">{result.link}</span>
              <Button variant="secondary" className="!w-auto !h-9 px-3 !text-[14px]" onClick={() => copy(result.link)}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button onClick={() => setInviting(null)}>Done</Button>
          </>
        ) : (
          inviting && (
            <>
              <h2 className="text-white text-[20px] font-bold mb-1">Invite {inviting === 'couple' ? 'your spouse or partner' : 'an accountability partner'}</h2>
              <p className="text-secondary text-[14px] mb-4">{ABOUT[inviting].text}</p>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void sendInvite()}
                placeholder="Their email address"
                className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary"
              />
              {error && <p className="text-danger text-[14px] mt-2">{error}</p>}
              <div className="mt-4">
                <Button onClick={sendInvite} disabled={!email.trim() || busy}>
                  {busy ? 'Sending…' : 'Send invite'}
                </Button>
              </div>
            </>
          )
        )}
      </BottomSheet>

      <BottomSheet open={confirmRemove !== null} onClose={() => setConfirmRemove(null)}>
        {confirmRemove && (
          <>
            <h2 className="text-white text-[20px] font-bold mb-2">
              {confirmRemove.status === 'active' ? `Stop sharing with ${nameOf(confirmRemove)}?` : 'Cancel this invite?'}
            </h2>
            <p className="text-secondary text-[15px] mb-5">
              {confirmRemove.status === 'active'
                ? `${KIND_LABEL[confirmRemove.kind]} access ends straight away. Nothing is deleted.`
                : 'The invite link will stop working.'}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
                Keep
              </Button>
              <Button onClick={() => remove(confirmRemove)} className="bg-danger! text-onfill!">
                {confirmRemove.status === 'active' ? 'Stop sharing' : 'Cancel invite'}
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
