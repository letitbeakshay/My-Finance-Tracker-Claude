import { useState } from 'react'
import { format } from 'date-fns'
import { Share2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { reflectionRepo } from '../../db/repository'
import { buildReport, type MonthPlan } from '../../lib/stewardship'
import { VERSES } from '../../lib/scripture'
import type { Reflection } from '../../types'

const AREA =
  'w-full min-h-[84px] bg-surface border border-border rounded-2xl px-4 py-3 text-white text-[16px] placeholder:text-tertiary resize-y'

const PROMPTS = [
  { key: 'gratitude', label: 'What am I grateful to God for this month?' },
  { key: 'improve', label: 'Where did I spend unwisely, and what will I change?' },
  { key: 'commitment', label: 'My commitment before the Lord for next month' },
] as const

interface ReflectionCardProps {
  month: Date
  plan: MonthPlan
  owed: number
  reflection?: Reflection
}

/** Remount with `key` per month so the fields reset when the month changes. */
export function ReflectionCard({ month, plan, owed, reflection }: ReflectionCardProps) {
  const [values, setValues] = useState({
    gratitude: reflection?.gratitude ?? '',
    improve: reflection?.improve ?? '',
    commitment: reflection?.commitment ?? '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'copied'>('idle')

  async function handleSave() {
    setStatus('saving')
    try {
      await reflectionRepo.save({ id: format(month, 'yyyy-MM'), ...values })
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  async function handleShare() {
    const text = buildReport(month, plan, owed, values)
    try {
      if (navigator.share) {
        await navigator.share({ title: `Stewardship report — ${format(month, 'MMMM yyyy')}`, text })
      } else {
        await navigator.clipboard.writeText(text)
        setStatus('copied')
      }
    } catch {
      // Share sheet dismissed — nothing to do.
    }
  }

  return (
    <Card>
      <h2 className="text-white text-[17px] font-bold">Monthly accountability</h2>
      <p className="text-tertiary text-[12px] italic mb-5">
        “{VERSES.faithful.text}” — {VERSES.faithful.ref}
      </p>

      <div className="flex flex-col gap-4 mb-5">
        {PROMPTS.map((p) => (
          <label key={p.key} className="block">
            <span className="block text-white text-[14px] font-medium mb-1.5">{p.label}</span>
            <textarea
              value={values[p.key]}
              onChange={(e) => {
                setValues({ ...values, [p.key]: e.target.value })
                setStatus('idle')
              }}
              className={AREA}
            />
          </label>
        ))}
      </div>

      {status === 'error' && (
        <p className="text-danger text-[14px] mb-3">
          Could not save. Make sure the latest supabase/schema.sql has been run.
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleShare}>
          <Share2 size={18} /> {status === 'copied' ? 'Copied' : 'Share report'}
        </Button>
        <Button onClick={handleSave} disabled={status === 'saving'}>
          {status === 'saved' ? 'Saved' : 'Save'}
        </Button>
      </div>
    </Card>
  )
}
