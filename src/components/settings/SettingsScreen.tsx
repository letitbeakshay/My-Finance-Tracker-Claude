import { useState } from 'react'
import { format } from 'date-fns'
import { CategoryManager } from './CategoryManager'
import { PaymentAccountManager } from './PaymentAccountManager'
import { EmbedCodeCard } from './EmbedCodeCard'
import { Card } from '../ui/Card'
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
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleExportCSV() {
    const csv = await dataRepo.exportCSV()
    downloadFile(csv, `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv')
  }

  async function handleExportJSON() {
    const json = await dataRepo.exportJSON()
    downloadFile(json, `expenses-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json')
  }

  async function handleDeleteAll() {
    await dataRepo.deleteAll()
    setConfirmDelete(false)
    onBack()
  }

  function handleLock() {
    lock()
    onLock()
  }

  return (
    <div className="px-6 pt-14 pb-10 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-[22px] font-bold">Settings</h1>
      </div>

      <CategoryManager />

      <PaymentAccountManager />

      <div className="mb-8">
        <h3 className="text-white text-[17px] font-bold mb-3">Data</h3>
        <Card className="flex flex-col gap-3">
          <Row label="Currency" value="₹ INR" />
          <Row label="Theme" value="Dark only" />
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

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2 className="text-white text-[20px] font-bold mb-2">Delete all data?</h2>
        <p className="text-secondary text-[14px] mb-6">
          This permanently deletes every expense and category on this device. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteAll} className="bg-danger! text-white!">
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
