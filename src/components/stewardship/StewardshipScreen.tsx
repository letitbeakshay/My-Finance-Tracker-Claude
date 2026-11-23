import { useState } from 'react'
import { PageHeader } from '../ui/PageHeader'
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
      <PageHeader title="Stewardship" onBack={onBack} />
      <div className="mb-4">
        <MonthNav month={month} onChange={setMonth} className="text-[19px] font-bold min-w-[150px] text-center" />
      </div>
      <StewardshipView month={month} onGive={onGive} />
    </div>
  )
}
