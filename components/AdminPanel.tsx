'use client'

import { useCallback, useState } from 'react'
import { adminListTeams, resetTeam, type AdminTeam } from '@/app/actions'

export default function AdminPanel() {
  const [pin, setPin] = useState('')
  const [teams, setTeams] = useState<AdminTeam[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(async (adminPin: string) => {
    setBusy(true)
    const result = await adminListTeams(adminPin)
    setBusy(false)
    if (!result.ok) {
      setTeams(null)
      setMessage(result.reason === 'bad_pin' ? 'Wrong PIN.' : 'Could not reach the database.')
      return
    }
    setTeams(result.teams)
    setMessage(null)
  }, [])

  const doReset = async (team: AdminTeam) => {
    setBusy(true)
    const result = await resetTeam(pin, team.id)
    setBusy(false)
    setConfirming(null)
    setMessage(result.ok ? `${team.name} can spin again.` : 'Reset failed.')
    await load(pin)
  }

  if (!teams) {
    return (
      <main className="mx-auto flex h-dvh max-w-md flex-col justify-center gap-6 overflow-y-auto p-8">
        <h1 className="display" style={{ fontSize: 'var(--step-title)' }}>
          Health Week admin
        </h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void load(pin)
          }}
        >
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Admin PIN"
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--color-lane)', color: 'var(--color-chalk)', border: '2px solid rgba(241,243,239,0.4)', fontSize: '1.25rem' }}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || pin.length === 0}>
            {busy ? 'Checking…' : 'Open'}
          </button>
        </form>
        {message ? <p style={{ color: 'var(--color-amber)' }}>{message}</p> : null}
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col gap-6 overflow-y-auto p-6">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="display" style={{ fontSize: 'var(--step-title)' }}>
          Teams
        </h1>
        <button type="button" className="btn" style={{ fontSize: '1rem', padding: '0.5em 1.2em' }} onClick={() => void load(pin)} disabled={busy}>
          Refresh
        </button>
      </header>

      {message ? <p style={{ color: 'var(--color-mint)' }}>{message}</p> : null}

      <ul className="flex flex-col gap-3">
        {teams.map((team) => (
          <li
            key={team.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            style={{ background: 'var(--color-lane)' }}
          >
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{team.name}</p>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                {team.status === 'waiting'
                  ? 'Has not spun'
                  : `${team.segmentLabel}${team.status === 'done' ? ' · done' : ' · not confirmed'}${team.hasPhoto ? ' · photo' : ''}`}
              </p>
            </div>

            {team.status === 'waiting' ? null : confirming === team.id ? (
              <div className="flex gap-2">
                <button type="button" className="btn btn-amber" style={{ fontSize: '1rem', padding: '0.5em 1.2em' }} onClick={() => void doReset(team)} disabled={busy}>
                  Confirm reset
                </button>
                <button type="button" className="btn" style={{ fontSize: '1rem', padding: '0.5em 1.2em' }} onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn"
                style={{ fontSize: '1rem', padding: '0.5em 1.2em' }}
                onClick={() => setConfirming(team.id)}
                disabled={busy}
              >
                Reset
              </button>
            )}
          </li>
        ))}
      </ul>

      <p style={{ fontSize: '0.95rem', opacity: 0.7 }}>
        Reset deletes the team&rsquo;s spin row and any photo they shared, and lets them spin again.
      </p>
    </main>
  )
}
