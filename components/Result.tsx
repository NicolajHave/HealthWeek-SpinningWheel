'use client'

import { SCALING_LINE, type Segment } from '@/lib/segments'

export interface ResultProps {
  segment: Segment
  isReplay: boolean
  alreadyCompleted: boolean
  busy: boolean
  powerUpLocation: string
  powerUpPrize: string
  onConfirm: () => void
  onDismiss: () => void
}

/** Result is the one screen people act on from across the room. */
const BUTTON = { fontSize: 'var(--step-title)', padding: '0.55em 1.8em' } as const

export default function Result({
  segment,
  isReplay,
  alreadyCompleted,
  busy,
  powerUpLocation,
  powerUpPrize,
  onConfirm,
  onDismiss,
}: ResultProps) {
  const isPrize = segment.type === 'prize'

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1rem,3vh,2.5rem)] p-[clamp(1.5rem,4vw,5rem)] text-center"
      style={{ background: isPrize ? 'var(--color-amber)' : 'var(--color-ink)', color: isPrize ? 'var(--color-ink)' : 'var(--color-chalk)' }}
    >
      {isReplay ? (
        <p style={{ fontSize: 'var(--step-small)', opacity: 0.7 }}>Your team already spun today.</p>
      ) : null}

      <h1 className="display" style={{ fontSize: 'var(--step-headline)', maxWidth: '18ch' }}>
        {segment.label}
      </h1>

      {isPrize ? (
        <p style={{ fontSize: 'var(--step-title)', maxWidth: '26ch', lineHeight: 1.15 }}>
          Your team&rsquo;s {powerUpPrize} are waiting at {powerUpLocation}. Just say your team name.
        </p>
      ) : (
        <p style={{ fontSize: 'var(--step-body)', maxWidth: '30ch', opacity: 0.85 }}>{SCALING_LINE}</p>
      )}

      {alreadyCompleted ? (
        <button
          type="button"
          className={isPrize ? 'btn btn-ink' : 'btn btn-primary'}
          style={BUTTON}
          onClick={onDismiss}
          disabled={busy}
          autoFocus
        >
          {isPrize ? 'Got it' : 'Back to the board'}
        </button>
      ) : (
        <div className="flex flex-wrap justify-center gap-[clamp(0.75rem,1.5vw,1.5rem)]">
          <button type="button" className="btn btn-mint" style={BUTTON} onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Saving…' : 'We did it'}
          </button>
          <button type="button" className={isPrize ? 'btn btn-ink' : 'btn'} style={BUTTON} onClick={onDismiss} disabled={busy}>
            Not this time
          </button>
        </div>
      )}
    </div>
  )
}
