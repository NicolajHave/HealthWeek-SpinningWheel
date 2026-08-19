'use client'

import { useEffect, useRef, useState } from 'react'

const ACTIVITY_EVENTS = ['pointerdown', 'touchstart', 'keydown', 'click'] as const

/**
 * Returns milliseconds left before the screen gives up and goes back to the
 * board. Any touch, key or click resets it. Disabled while the wheel spins.
 */
export function useIdleTimeout(enabled: boolean, ms: number, onTimeout: () => void): number {
  const [remaining, setRemaining] = useState(ms)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!enabled) {
      setRemaining(ms)
      return
    }

    let deadline = Date.now() + ms
    const reset = () => {
      deadline = Date.now() + ms
    }
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, reset, { passive: true })
    }

    const tick = window.setInterval(() => {
      const left = deadline - Date.now()
      setRemaining(Math.max(0, left))
      if (left <= 0) onTimeoutRef.current()
    }, 100)

    return () => {
      window.clearInterval(tick)
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, reset)
    }
  }, [enabled, ms])

  return remaining
}

/**
 * The display must never sleep — nobody is in the room to wake it. The lock is
 * dropped by the browser whenever the page is hidden, so re-request it.
 */
export function useWakeLock(): void {
  useEffect(() => {
    type WakeLockSentinel = { release: () => Promise<void> }
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> }
    }
    if (!nav.wakeLock) return

    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        sentinel = await nav.wakeLock!.request('screen')
        if (cancelled) void sentinel.release()
      } catch {
        // Denied or unsupported — the OS-level sleep setting is the real fix.
      }
    }

    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      void sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [])
}

/** Fullscreen on first interaction, so no browser chrome is visible or tappable. */
export function useFullscreenOnFirstInteraction(active: boolean): void {
  useEffect(() => {
    if (!active) return

    const go = () => {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen?.().catch(() => {})
      }
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, go)
    }
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, go, { passive: true })
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, go)
    }
  }, [active])
}

/** True once, on the client, if the visitor asked for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const listener = () => setReduced(query.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])
  return reduced
}
