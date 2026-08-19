'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './runtime'

const DURATION = 800

/** Ticks up over 800ms when the number changes. Nothing else on the board animates. */
export default function RepCounter({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      fromRef.current = value
      setShown(value)
      return
    }

    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    let frame = 0

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (t < 1) {
        frame = requestAnimationFrame(step)
      } else {
        fromRef.current = value
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {shown.toLocaleString('en-GB')}
    </span>
  )
}
