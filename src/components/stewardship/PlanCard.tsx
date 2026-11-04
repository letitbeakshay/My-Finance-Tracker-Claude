import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { settingsRepo } from '../../db/repository'
import { formatCurrency } from '../../lib/currency'
import type { AppSettings } from '../../types'

const FIELD =
  'w-full h-12 bg-surface border border-border rounded-2xl px-4 text-white text-[16px] tabular-nums'

function Field({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-white text-[14px] font-medium">{label}</span>
      <span className="block text-tertiary text-[12px] mb-1.5">{hint}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
        inputMode="decimal"
        className={FIELD}
      />
    </label>
  )
}

export function PlanCard({ settings }: { settings: AppSettings }) {
  const [editing, setEditing] = useState(false)
  const [giving, setGiving] = useState('')
  const [saving, setSaving] = useState('')
  const [threshold, setThreshold] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) {
      setGiving(String(settings.givingPercent))
      setSaving(String(settings.savingPercent))
      setThreshold(String(settings.pauseThreshold))
      setError('')
    }
  }, [editing, settings])

  const givingN = parseFloat(giving)
  const savingN = parseFloat(saving)
  const valid = givingN >= 0 && savingN >= 0 && givingN + savingN <= 100

  async function handleSave() {
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      await settingsRepo.updatePlan({
        givingPercent: givingN,
        savingPercent: savingN,
        pauseThreshold: parseFloat(threshold) || 0,
      })
      setEditing(false)
    } catch {
      setError('Could not save. Make sure the latest supabase/schema.sql has been run.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-[17px] font-bold">My plan</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-accent-ink text-[14px] font-semibold h-9 px-3 rounded-full bg-accent-soft"
          >
            Edit
          </button>
        )}
      </div>
      <p className="text-tertiary text-[12px] mb-4">
        10% is the traditional tithe. Set what you have purposed in your heart (2 Corinthians 9:7).
      </p>

      {editing ? (
        <div className="flex flex-col gap-4">
          <Field label="Give first (%)" hint="Tithe and offerings, of income received" value={giving} onChange={setGiving} />
          <Field label="Save (%)" hint="Set aside for the future" value={saving} onChange={setSaving} />
          <Field
            label="Pause before wants over"
            hint="Ask “have I counted the cost?” first. 0 turns it off"
            value={threshold}
            onChange={setThreshold}
          />
          {error && <p className="text-danger text-[14px]">{error}</p>}
          {!valid && <p className="text-danger text-[14px]">Giving and saving together can’t pass 100%.</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!valid || busy}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 text-[14px]">
          <Row label="Give first" value={`${settings.givingPercent}%`} />
          <Row label="Save" value={`${settings.savingPercent}%`} />
          <Row
            label="Pause before wants over"
            value={settings.pauseThreshold > 0 ? formatCurrency(settings.pauseThreshold) : 'Off'}
          />
        </div>
      )}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-secondary">{label}</span>
      <span className="text-white font-medium tabular-nums">{value}</span>
    </div>
  )
}
