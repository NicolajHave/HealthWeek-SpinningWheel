'use client'

import { useEffect, useRef, useState } from 'react'
import { SEGMENTS } from '@/lib/segments'

const R = 96
const HUB = 15
const LABEL_R = 64

/** Screen point for an angle measured clockwise from top. */
function point(angleDeg: number, radius: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [radius * Math.sin(a), -radius * Math.cos(a)]
}

function wedgePath(index: number): string {
  const a1 = index * 60
  const a2 = a1 + 60
  const [x1, y1] = point(a1, R)
  const [x2, y2] = point(a2, R)
  // 60 degrees, so large-arc is 0; sweep 1 is clockwise in SVG's y-down space.
  return `M 0 0 L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 0 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`
}

function fillFor(index: number): string {
  // The system carries no colour, so the prize is the one inverted wedge.
  // Solid ink against light grey reads from the far side of the room.
  if (SEGMENTS[index].type === 'prize') return 'var(--color-ink)'
  return index % 2 === 1 ? 'var(--color-lane)' : '#ffffff'
}

export interface WheelProps {
  /** Index the server picked. Null while idle. */
  targetIndex: number | null
  onSettled?: () => void
  /** Deterministic per spin, so the render is stable across re-renders. */
  jitter?: number
  /** CSS length. Smaller at rest on the board than during the spin itself. */
  size?: string
  /**
   * Angle the wheel sits at while idle. The board uses 180 so a divider, not a
   * segment, lands under the pointer — at 0 the prize wedge starts right at the
   * tip and the wheel reads as though it just landed on it.
   */
  idleRotation?: number
}

/** Where the wheel comes to rest. Known up front — the server decided already. */
function restRotation(targetIndex: number | null, jitter: number, idle: number): number {
  if (targetIndex === null) return idle
  // Segment i is centered at i * 60 + 30 degrees clockwise from top, so
  // rotating the wheel back by that amount brings it under the pointer.
  return 360 * 5 + (360 - (targetIndex * 60 + 30)) + jitter
}

export default function Wheel({
  targetIndex,
  onSettled,
  jitter = 0,
  size = 'min(80vh, 80vw)',
  idleRotation = 0,
}: WheelProps) {
  const [rotation, setRotation] = useState(idleRotation)
  const [transition, setTransition] = useState('none')
  const settledRef = useRef(onSettled)
  settledRef.current = onSettled
  const rest = restRotation(targetIndex, jitter, idleRotation)

  useEffect(() => {
    if (targetIndex === null) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduced ? 600 : 5000

    const target = rest

    // Two frames so the initial rotation is definitely committed before the
    // transition is armed — otherwise the wheel can snap instead of spin.
    let inner = 0
    const frame = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setTransition(
          reduced
            ? `transform ${duration}ms ease-out`
            : `transform ${duration}ms cubic-bezier(0.15, 0.9, 0.25, 1)`,
        )
        setRotation(target)
      })
    })
    const timer = setTimeout(() => settledRef.current?.(), duration + 120)

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(inner)
      clearTimeout(timer)
    }
  }, [targetIndex, rest])

  return (
    <div
      className="relative aspect-square"
      style={{ width: size }}
      role="img"
      aria-label="Spin wheel with six segments"
    >
      <div
        className="absolute inset-0"
        style={{ transform: `rotate(${rotation}deg)`, transition, willChange: 'transform' }}
      >
        <svg viewBox="-100 -100 200 200" className="h-full w-full">
          {SEGMENTS.map((segment, i) => (
            <path key={segment.key} d={wedgePath(i)} fill={fillFor(i)} />
          ))}

          {/* Thick chalk dividers, drawn over the fills. */}
          {SEGMENTS.map((_, i) => {
            const [x, y] = point(i * 60, R)
            return (
              <line
                key={`divider-${i}`}
                x1={0}
                y1={0}
                x2={x}
                y2={y}
                stroke="var(--color-ink)"
                strokeWidth={1.4}
              />
            )
          })}

          <circle cx={0} cy={0} r={R} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} />

          {SEGMENTS.map((segment, i) => {
            const mid = i * 60 + 30
            // Labels run tangentially, so the segment under the pointer reads
            // straight across. The flip is decided from where the wheel comes
            // to rest, not from the unrotated wheel — otherwise the winning
            // label can settle upside down.
            const atRest = (((mid + rest) % 360) + 360) % 360
            const flip = atRest > 90 && atRest <= 270 ? ' rotate(180)' : ''
            const isPrize = segment.type === 'prize'
            return (
              <g key={`label-${segment.key}`} transform={`rotate(${mid}) translate(0 ${-LABEL_R})${flip}`}>
                <text
                  textAnchor="middle"
                  fill={isPrize ? 'var(--color-paper)' : 'var(--color-ink)'}
                  className="mono"
                  style={{ fontSize: isPrize ? 7.2 : 6.4, letterSpacing: '0.08em' }}
                >
                  <tspan x={0} y={-3.4}>
                    {segment.wheelLines[0]}
                  </tspan>
                  <tspan x={0} y={isPrize ? 6.6 : 6}>
                    {segment.wheelLines[1]}
                  </tspan>
                </text>
              </g>
            )
          })}

          <circle cx={0} cy={0} r={HUB} fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth={2.5} />
        </svg>
      </div>

      {/* Pointer wedge, locked at top — deliberately outside the rotating group. */}
      <svg viewBox="-100 -100 200 200" className="pointer-events-none absolute inset-0 h-full w-full">
        <polygon points="0,-76 -11,-104 11,-104" fill="var(--color-ink)" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
