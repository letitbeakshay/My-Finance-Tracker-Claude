import { useState } from 'react'
import { MonthNav } from '../ui/MonthNav'
import { StewardshipView } from './StewardshipView'

interface StewardshipScreenProps {
  onBack: () => void
  onGive: (amount: number) => void
}

/** Full-screen stewardship page for the mobile Enter expenses flow. */
export function StewardshipScreen({ onBack, onGive }: StewardshipScreenProps) {
  const [month, setMonth] = useState(() => new Date())

  return (
    <div className="px-6 pt-3 pb-10 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-4">
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
        <h1 className="text-[22px] font-bold">Stewardship</h1>
      </div>
      <div className="mb-4">
        <MonthNav month={month} onChange={setMonth} className="text-[19px] font-bold min-w-[150px] text-center" />
      </div>
      <StewardshipView month={month} onGive={onGive} />
    </div>
  )
}
