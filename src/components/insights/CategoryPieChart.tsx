import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '../ui/Card'
import type { Category } from '../../types'
import { formatCurrency } from '../../lib/currency'
import { CATEGORICAL_DARK, CHART_OTHER_COLOR } from '../../lib/chartPalette'

interface CategoryPieChartProps {
  breakdown: { categoryId: string; amount: number }[]
  categoryMap: Map<string, Category>
}

const MAX_SLICES = 4

export function CategoryPieChart({ breakdown, categoryMap }: CategoryPieChartProps) {
  const { slices, total } = useMemo(() => {
    const top = breakdown.slice(0, MAX_SLICES)
    const rest = breakdown.slice(MAX_SLICES)
    const restTotal = rest.reduce((acc, b) => acc + b.amount, 0)
    const slices = top.map((b, i) => ({
      key: b.categoryId,
      name: categoryMap.get(b.categoryId)?.name ?? 'Others',
      icon: categoryMap.get(b.categoryId)?.icon ?? '📦',
      value: b.amount,
      color: CATEGORICAL_DARK[i],
    }))
    if (restTotal > 0) {
      slices.push({ key: '__other__', name: 'Other', icon: '📦', value: restTotal, color: CHART_OTHER_COLOR })
    }
    const total = slices.reduce((acc, s) => acc + s.value, 0)
    return { slices, total }
  }, [breakdown, categoryMap])

  if (slices.length === 0) return null

  return (
    <Card className="mb-6">
      <h3 className="text-white text-[17px] font-bold mb-4">Category Breakdown</h3>
      <div className="flex items-center gap-4">
        <div className="w-[140px] h-[140px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
                animationDuration={700}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2dfd5',
                  borderRadius: 12,
                  fontSize: 13,
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex flex-col gap-2.5 min-w-0">
          {slices.map((s) => (
            <div key={s.key} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-white text-[13px] truncate flex-1">
                {s.icon} {s.name}
              </span>
              <span className="text-secondary text-[12px] shrink-0 tabular-nums">
                {Math.round((s.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
