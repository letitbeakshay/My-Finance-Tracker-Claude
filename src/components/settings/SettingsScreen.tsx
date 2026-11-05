import { useState } from 'react'
import { format } from 'date-fns'
import { CategoryManager } from './CategoryManager'
import { CategoryPlanCard } from './CategoryPlanCard'
import { PaymentAccountManager } from './PaymentAccountManager'
import { EmbedCodeCard } from './EmbedCodeCard'
import { Card } from '../ui/Card'
import { SegmentedControl } from '../ui/SegmentedControl'
import { useTheme, type Theme } from '../../lib/theme'
import { Button } from '../ui/Button'
import { BottomSheet } from '../ui/BottomSheet'
import { dataRepo } from '../../db/repository'
import { downloadFile } from '../../lib/download'
import { lock } from '../../lib/auth'

interface SettingsScreenProps {
  onBack: () => void
  onLock: () => void
}

export function SettingsScreen({ onBack, onLock }: SettingsScreenProps) {
  const { theme, set: setTheme } = useTheme()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleteError, setDeleteError] = useState('')

  async function handleExportCSV() {
    const csv = await dataRepo.exportCSV()
    downloadFile(csv, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  }

  async function handleExportJSON() {
    const json = await dataRepo.exportJSON()
    downloadFile(json, `expenses-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
  }

  async function handleDeleteAll() {
    setDeleteError('')
    try {
      // A backup file is saved first, so this can always be undone.
      const json = await dataRepo.exportJSON()
      downloadFile(json, `backup-before-delete-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`, 'application/json')
      await dataRepo.deleteAll()
      setConfirmDelete(false)
      setTyped('')
      onBack()
    } catch {
      setDeleteError('Something went wrong, so nothing more was deleted. Your backup file was still saved.')
    }
  }

  function handleLock() {
    lock()
    onLock()
  }

  return (
    <div className="px-6 pt-3 pb-10 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold">Settings</h1>
      </div>

      <CategoryPlanCard />

      <CategoryManager />

      <PaymentAccountManager />

      <div className="mb-8">
        <h3 className="text-white text-[17px] font-bold mb-3">Data</h3>
        <Card className="flex flex-col gap-3">
          <Row label="Currency" value="₹ INR" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-secondary text-[14px]">Theme</span>
            <div className="w-[190px]">
              <SegmentedControl<Theme>
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
                value={theme}
                onChange={setTheme}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportJSON}>
              Export JSON
            </Button>
          </div>
        </Card>
      </div>

      <EmbedCodeCard />

      <div className="mb-4">
        <Button variant="secondary" onClick={handleLock}>
          Lock App
        </Button>
      </div>

      <div className="mb-8">
        <Button variant="secondary" onClick={() => setConfirmDelete(true)} className="text-danger!">
          Delete All Data
        </Button>
      </div>

      <p className="text-tertiary text-[12px] text-center">Finance Tracker · v1.0 · Synced with Supabase</p>

      <BottomSheet
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false)
          setTyped('')
          setDeleteError('')
        }}
      >
        <h2 className="text-white text-[20px] font-bold mb-2">Delete all data?</h2>
        <p className="text-secondary text-[14px] mb-4">
          This deletes every expense, income, loan, budget, category and account. A backup file is
          downloaded first. To continue, type <span className="text-white font-semibold">DELETE</span>.
        </p>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type DELETE"
          autoCapitalize="characters"
          className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-white text-[16px] placeholder:text-tertiary mb-4"
        />
        {deleteError && <p className="text-danger text-[14px] mb-3">{deleteError}</p>}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmDelete(false)
              setTyped('')
              setDeleteError('')
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteAll} disabled={typed.trim() !== 'DELETE'} className="bg-danger! text-onfill!">
            Delete Everything
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-secondary text-[14px]">{label}</span>
      <span className="text-white text-[14px] font-medium">{value}</span>
    </div>
  )
}
