'use client'

import { useEffect, useState } from 'react'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const

export interface PinPadProps {
  onSubmit: (pin: string) => void
  error: string | null
  busy: boolean
  onCancel: () => void
}

export default function PinPad({ onSubmit, error, busy, onCancel }: PinPadProps) {
  const [pin, setPin] = useState('')

  // Four digits is the whole PIN, so submit as soon as the fourth lands.
  useEffect(() => {
    if (pin.length === 4 && !busy) {
      onSubmit(pin)
      setPin('')
    }
  }, [pin, busy, onSubmit])

  const press = (key: string) => {
    if (busy) return
    if (key === 'clear') return setPin('')
    if (key === 'back') return setPin((p) => p.slice(0, -1))
    setPin((p) => (p.length >= 4 ? p : p + key))
  }

  // A wireless keyboard has to work as well as the touchscreen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key)
      else if (event.key === 'Backspace') press('back')
      else if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(1rem,2.5vh,2.5rem)] p-[clamp(1.5rem,3vw,4rem)]">
      <h1 className="display text-center" style={{ fontSize: 'var(--step-headline)', fontWeight: 400 }}>
        Enter your team PIN
      </h1>

      <div className="flex gap-[clamp(0.75rem,1.5vw,1.5rem)]" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 'clamp(3.5rem, 5vw, 6rem)',
              height: 'clamp(4.5rem, 6.5vw, 7.5rem)',
              border: '2px solid var(--color-ink)',
              background: i < pin.length ? 'var(--color-ink)' : 'transparent',
              transition: 'background-color 120ms ease',
            }}
          />
        ))}
      </div>

      <p
        aria-live="polite"
        className="label text-center"
        style={{ color: error ? 'var(--color-ink)' : 'transparent', minHeight: '1.4em', maxWidth: '44ch' }}
      >
        {error ?? 'placeholder'}
      </p>

      <div className="grid grid-cols-3 gap-[clamp(0.6rem,1.2vw,1.25rem)]">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="btn"
            onClick={() => press(key)}
            disabled={busy}
            style={{
              width: 'clamp(6rem, 9vw, 10rem)',
              height: 'clamp(4rem, 6vh, 6rem)',
              padding: 0,
              letterSpacing: key === 'clear' ? '0.1em' : '0',
              fontSize: key === 'clear' || key === 'back' ? 'var(--step-label)' : 'var(--step-title)',
              opacity: busy ? 0.5 : 1,
            }}
            aria-label={key === 'back' ? 'Delete last digit' : key === 'clear' ? 'Clear' : key}
          >
            {key === 'back' ? '⌫' : key === 'clear' ? 'Clear' : key}
          </button>
        ))}
      </div>

      <button type="button" className="btn" onClick={onCancel} style={{ fontSize: 'var(--step-label)' }}>
        Back to the board
      </button>
    </div>
  )
}
