'use client'

import { SCALING_LINE, type Segment } from '@/lib/segments'
import { Lockup } from './Marks'

const BUTTON = { fontSize: 'var(--step-title)', padding: '0.5em 1.6em' } as const

export interface ResultProps {
  segment: Segment
  isReplay: boolean
  alreadyCompleted: boolean
  busy: boolean
  powerUpLocation: string
  powerUpPrize: string
  photoPrize: string
  onConfirm: () => void
  onDismiss: () => void
}

export default function Result({
  segment,
  isReplay,
  alreadyCompleted,
  busy,
  powerUpLocation,
  powerUpPrize,
  photoPrize,
  onConfirm,
  onDismiss,
}: ResultProps) {
  const isPrize = segment.type === 'prize'

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-[clamp(1.5rem,3vw,3.5rem)]"
      style={{
        background: isPrize ? 'var(--color-ink)' : 'var(--color-paper)',
        color: isPrize ? 'var(--color-paper)' : 'var(--color-ink)',
      }}
    >
      <header className="flex items-baseline justify-between gap-6">
        <Lockup invert={isPrize} />
        <p className="label" style={{ opacity: isPrize ? 0.7 : 0.55, color: isPrize ? 'var(--color-paper)' : 'var(--color-mute)' }}>
          {isReplay ? 'Your team already spun today' : isPrize ? 'Prize' : 'Your exercise'}
        </p>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(1rem,2.6vh,2.25rem)] text-center">
        <h1 className="display" style={{ fontSize: 'var(--step-headline)', fontWeight: 400, maxWidth: '16ch' }}>
          {segment.label}
        </h1>

        {isPrize ? (
          <p className="display" style={{ fontSize: 'var(--step-title)', fontWeight: 400, maxWidth: '26ch' }}>
            Your team&rsquo;s {powerUpPrize} are waiting at {powerUpLocation}. Just say your team name.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 'var(--step-body)', maxWidth: '34ch', opacity: 0.7 }}>{SCALING_LINE}</p>
            {/* The nudge that keeps photo participation alive: ask for the
                photo while they are still warm, not after they have walked off. */}
            <p className="label" style={{ maxWidth: '40ch', lineHeight: 1.6 }}>
              One more rep for the camera? Best team photo today wins a {photoPrize}
            </p>
          </>
        )}
      </div>

      <footer className="flex justify-center">
        {alreadyCompleted ? (
          <button
            type="button"
            className={isPrize ? 'btn btn-invert' : 'btn btn-primary'}
            style={BUTTON}
            onClick={onDismiss}
            disabled={busy}
            autoFocus
          >
            {isPrize ? 'Got it' : 'Done'}
          </button>
        ) : (
          /* No opt-out. Every team that spins finishes on the same button. */
          <button type="button" className="btn btn-primary" style={BUTTON} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Saving…' : 'We did it!'}
          </button>
        )}
      </footer>
    </div>
  )
}
