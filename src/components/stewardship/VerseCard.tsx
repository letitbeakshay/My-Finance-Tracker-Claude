import { Quote } from 'lucide-react'
import { Card } from '../ui/Card'
import type { Verse } from '../../lib/scripture'

export function VerseCard({ verse, className }: { verse: Verse; className?: string }) {
  return (
    <Card className={className}>
      <Quote size={18} className="text-giving mb-2.5" />
      <p className="text-white text-[16px] leading-relaxed">{verse.text}</p>
      <p className="text-giving text-[13px] font-semibold mt-2.5">{verse.ref} · KJV</p>
    </Card>
  )
}
