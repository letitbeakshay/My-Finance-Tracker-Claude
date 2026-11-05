import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Card } from '../ui/Card'
import { formatCurrency } from '../../lib/currency'
import { CHART_MUTED_TEXT } from '../../lib/chartPalette'

interface WeeklyBarChartProps {
  weeks: { label: string; amount: number }[]
}

export function WeeklyBarChart({ weeks }: WeeklyBarChartProps) {
  return (
    <Card className="mb-6">
      <h3 className="text-white text-[17px] font-bold mb-4">Weekly Spending</h3>
      <div className="h-[160px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_MUTED_TEXT, fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(60,58,59,0.05)' }}
              contentStyle={{
                background: '#ffffff',
                color: '#3c3a3b',
                border: '1px solid #e6ded4',
                borderRadius: 12,
                fontSize: 13,
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Bar dataKey="amount" fill="#3987e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
