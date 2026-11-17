import { useState } from 'react'
import { Compass } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Tour } from './Tour'

/** Settings: replay the quick tour. */
export function TourCard() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-3">Quick tour</h3>
      <Card className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center shrink-0">
          <Compass size={20} />
        </span>
        <p className="flex-1 text-secondary text-[14px] leading-snug">A one-minute guide to the main things.</p>
        <Button variant="secondary" className="!w-auto px-5 !h-11 !text-[15px]" onClick={() => setOpen(true)}>
          Take the tour
        </Button>
      </Card>
      {open && <Tour onClose={() => setOpen(false)} />}
    </div>
  )
}
