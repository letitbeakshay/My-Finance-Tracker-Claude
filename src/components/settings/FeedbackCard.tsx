import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import clsx from 'clsx'
import { Check, MessageSquareHeart } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { BottomSheet } from '../ui/BottomSheet'
import { feedbackRepo } from '../../db/repository'

const KINDS = [
  { value: 'idea', label: 'An idea' },
  { value: 'problem', label: 'A problem' },
  { value: 'other', label: 'Something else' },
] as const

/** A way to tell us what to improve, with a short note. */
export function FeedbackCard() {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<(typeof KINDS)[number]['value']>('idea')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function close() {
    setOpen(false)
    setSent(false)
    setError('')
    setText('')
  }

  async function send() {
    if (!text.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      await feedbackRepo.send(kind, text)
      setSent(true)
    } catch {
      setError('Could not send it. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-3">Help us improve</h3>
      <Card className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
          <MessageSquareHeart size={20} />
        </span>
        <p className="flex-1 text-secondary text-[14px] leading-snug">Found a problem, or want something added? Tell us.</p>
        <Button className="!w-auto px-5 !h-11 !text-[15px]" onClick={() => setOpen(true)}>
          Send feedback
        </Button>
      </Card>

      <BottomSheet open={open} onClose={close}>
        {sent ? (
          <>
            <div className="w-14 h-14 rounded-full bg-accent-soft border-2 border-accent flex items-center justify-center text-accent-ink mb-4">
              <Check size={28} strokeWidth={3} />
            </div>
            <h2 className="text-white text-[20px] font-bold mb-1">Thank you</h2>
            <p className="text-secondary text-[15px] mb-5">We read every note.</p>
            <Button onClick={close}>Done</Button>
          </>
        ) : (
          <>
            <h2 className="text-white text-[20px] font-bold mb-4">Send feedback</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  aria-pressed={kind === k.value}
                  className={clsx('h-10 px-4 rounded-full border text-[14px] font-medium', kind === k.value ? 'bg-accent-soft border-accent text-accent-ink' : 'bg-surface border-border text-white')}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="What would you like us to know?"
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-white text-[16px] placeholder:text-tertiary focus:border-accent outline-none resize-none"
            />
            {error && <p className="text-danger text-[14px] mt-2">{error}</p>}
            <div className="mt-4">
              <Button onClick={send} disabled={!text.trim() || busy}>
                {busy ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
