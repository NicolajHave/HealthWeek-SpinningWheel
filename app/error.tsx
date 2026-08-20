'use client'

import { useEffect } from 'react'

/** Route-level twin of the in-app error boundary: never leave a stack trace on screen. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => reset(), 5000)
    return () => clearTimeout(timer)
  }, [reset])

  return (
    <div className="flex h-dvh w-screen items-center justify-center p-8 text-center">
      <p className="display" style={{ fontSize: 'var(--step-title)', fontWeight: 400, maxWidth: '20ch' }}>
        One moment — back to the board.
      </p>
    </div>
  )
}
