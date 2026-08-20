'use client'

const WARNING_MS = 8000

/** A subtle line in the last 8 seconds, so nobody gets kicked out mid-thought. */
export default function IdleBar({ remaining }: { remaining: number }) {
  if (remaining > WARNING_MS) return null
  const fraction = Math.max(0, Math.min(1, remaining / WARNING_MS))

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6px]" aria-hidden="true">
      <div
        className="h-full"
        style={{ width: `${fraction * 100}%`, background: 'var(--color-ink)', opacity: 0.35, transition: 'width 120ms linear' }}
      />
    </div>
  )
}
