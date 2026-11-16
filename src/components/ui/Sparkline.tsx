import { useId, useMemo } from 'react'
import { formatCurrency } from '../../lib/currency'

/**
 * A soft white line over the green panel with a black bubble on the highest point, like the reference design.
 * `values` are the points in order (for example spending for each day of the month so far).
 */
export function Sparkline({ values, labels, caption, height = 120 }: { values: number[]; labels?: string[]; caption?: string; height?: number }) {
  const id = useId().replace(/:/g, '')
  const W = 320
  const H = height
  const pad = 10
  const geo = useMemo(() => {
    const v = values.length > 1 ? values : [0, ...values, 0]
    const max = Math.max(...v, 1)
    const pts = v.map((y, i) => [pad + (i / (v.length - 1)) * (W - pad * 2), H - 22 - (y / max) * (H - 62)] as const)
    // A smooth curve through the points.
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const cx = (x0 + x1) / 2
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
    }
    const peak = v.indexOf(Math.max(...v))
    return { d, pts, peak, v }
  }, [values, H])

  const [px, py] = geo.pts[geo.peak]
  const bubbleW = 118
  const bx = Math.min(Math.max(px - bubbleW / 2, 4), W - bubbleW - 4)

  return (
    <div className="mt-5 -mx-2" aria-hidden>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height }}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${geo.d} L ${geo.pts.at(-1)![0]} ${H - 22} L ${geo.pts[0][0]} ${H - 22} Z`} fill={`url(#${id})`} />
        <path d={geo.d} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        {geo.v[geo.peak] > 0 && (
          <>
            <circle cx={px} cy={py} r="5" fill="#fff" stroke="#161a16" strokeWidth="2.5" />
            <g>
              <rect x={bx} y={Math.max(py - 44, 2)} width={bubbleW} height="30" rx="12" fill="#161a16" />
              <path d={`M ${px - 6} ${Math.max(py - 44, 2) + 30} L ${px} ${Math.max(py - 44, 2) + 38} L ${px + 6} ${Math.max(py - 44, 2) + 30} Z`} fill="#161a16" />
              <text x={bx + bubbleW / 2} y={Math.max(py - 44, 2) + 20} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="Instrument Sans, system-ui, sans-serif">
                {formatCurrency(geo.v[geo.peak])}
              </text>
            </g>
          </>
        )}
        {labels && labels.length > 0 && (
          <g fontSize="10.5" fill="#fff" opacity="0.75" fontFamily="Instrument Sans, system-ui, sans-serif">
            {labels.map((l, i) => (
              <text key={l + i} x={pad + (i / Math.max(1, labels.length - 1)) * (W - pad * 2)} y={H - 4} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
                {l}
              </text>
            ))}
          </g>
        )}
      </svg>
      {caption && <p className="text-[11px] opacity-80 px-2 -mt-1">{caption}</p>}
    </div>
  )
}
