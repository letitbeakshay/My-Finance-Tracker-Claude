import { Card } from '../ui/Card'

interface MonthlySummaryProps {
  needsPct: number
  wantsPct: number
  savingsPct: number
}

export function MonthlySummary({ needsPct, wantsPct, savingsPct }: MonthlySummaryProps) {
  const items = [
    { label: 'Needs', pct: needsPct, color: '#5b9dff' },
    { label: 'Wants', pct: wantsPct, color: '#ff9f43' },
    { label: 'Savings', pct: savingsPct, color: '#5fb888' },
  ]
  return (
    <Card className="mb-8">
      <h3 className="text-white text-[17px] font-bold mb-4">Monthly Summary</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-white/5">
        {items.map((item) => (
          <div
            key={item.label}
            style={{ width: `${item.pct}%`, background: item.color }}
            className="h-full transition-all duration-700"
          />
        ))}
      </div>
      <div className="flex justify-between">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            <span className="text-white text-[18px] font-bold tabular-nums">{item.pct}%</span>
            <span className="text-secondary text-[12px]">{item.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
