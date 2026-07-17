import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { formatCurrency } from '../../lib/currency'

interface AnimatedNumberProps {
  value: number
  currency?: string
  className?: string
}

export function AnimatedNumber({ value, currency = '₹', className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value])

  return <span className={className}>{formatCurrency(display, currency)}</span>
}
