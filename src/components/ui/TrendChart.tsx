import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '../../lib/currency'
import { changePct, type TrendPoint } from '../../lib/trend'

/**
 * The area chart from the reference design: a white line over the green panel, fading to white at the bottom,
 * month names along the bottom, and a black bubble above the chosen point. Touch or hover to move the bubble.
 */
export function TrendChart({ points, active, onActive, height = 170 }: { points: TrendPoint[]; active: number; onActive: (i: number) => void; height?: number }) {
  const id = useId().replace(/:/g, '')
  const ref = useRef<SVGSVGElement>(null)
  // The chart is drawn at the width it is shown at, so it stays crisp from a phone to a wide desktop panel.
  const [W, setW] = useState(340)
  const H = height
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(Math.max(240, Math.round(el.getBoundingClientRect().width)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const padX = 14
  const base = H - 30
  const geo = useMemo(() => {
    const max = Math.max(...points.map((p) => p.value), 1)
    const pts = points.map((p, i) => [padX + (i / Math.max(1, points.length - 1)) * (W - padX * 2), base - 12 - (p.value / max) * (base - 76)] as const)
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const cx = (x0 + x1) / 2
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`
    }
    return { pts, d }
  }, [points, W, base])

  function pick(clientX: number) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * W
    let best = 0
    geo.pts.forEach(([px], i) => {
      if (Math.abs(px - x) < Math.abs(geo.pts[best][0] - x)) best = i
    })
    onActive(best)
  }

  const [ax, ay] = geo.pts[active]
  const bw = 150
  const bh = 52
  const bx = Math.min(Math.max(ax - bw / 2, 2), W - bw - 2)
  const by = Math.max(ay - bh - 16, 2)
  const change = changePct(points, active)
  const up = (change ?? 0) >= 0

  return (
    <div className="relative mt-4 -mx-1 select-none" aria-label="Spending trend">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block touch-none"
        style={{ height }}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && pick(e.clientX)}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${geo.d} L ${geo.pts.at(-1)![0]} ${base} L ${geo.pts[0][0]} ${base} Z`} fill={`url(#${id})`} />
        <path d={geo.d} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <line x1={ax} x2={ax} y1={ay + 6} y2={base} stroke="#fff" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={ax} cy={ay} r="5.5" fill="#fff" stroke="#161a16" strokeWidth="2.5" />
        <g>
          <rect x={bx} y={by} width={bw} height={bh} rx="16" fill="#161a16" />
          <path d={`M ${ax - 7} ${by + bh} L ${ax} ${by + bh + 9} L ${ax + 7} ${by + bh} Z`} fill="#161a16" />
          <text x={bx + 14} y={by + 24} fontSize="17" fontWeight="600" fill="#fff" fontFamily="Instrument Sans, system-ui, sans-serif">
            {formatCurrency(points[active].value)}
          </text>
          <text x={bx + 14} y={by + 41} fontSize="11" fill="#fff" opacity="0.7" fontFamily="Instrument Sans, system-ui, sans-serif">
            for {points[active].full}
          </text>
        </g>
        {points.map((p, i) => (
          <text
            key={p.full}
            x={geo.pts[i][0]}
            y={H - 8}
            textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            fontSize="11.5"
            fontWeight={i === active ? 700 : 500}
            fill="#fff"
            opacity={i === active ? 1 : 0.7}
            fontFamily="Instrument Sans, system-ui, sans-serif"
          >
            {p.label}
          </text>
        ))}
      </svg>
      {change !== null && (
        <span
          className="absolute inline-flex items-center gap-0.5 rounded-full text-[11px] font-semibold px-2 h-5 pointer-events-none"
          style={{ left: bx + bw - 62, top: by + 7, background: '#fff', color: '#161a16' }}
        >
          {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(change).toFixed(1)}%
        </span>
      )}
    </div>
  )
}
