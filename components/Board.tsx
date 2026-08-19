'use client'

import type { Board as BoardData, BoardTeam } from '@/app/actions'
import RepCounter from './RepCounter'

function Tile({ team }: { team: BoardTeam }) {
  const isWaiting = team.status === 'waiting'
  const isDone = team.status === 'done'

  return (
    <div
      className="fade-in relative flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl p-[clamp(0.75rem,1.1vw,1.25rem)]"
      style={{
        border: isWaiting ? '3px solid rgba(241,243,239,0.22)' : '3px solid rgba(241,243,239,0.5)',
        background: isWaiting ? 'transparent' : 'var(--color-lane)',
        backgroundImage: team.photoUrl ? `url(${team.photoUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {team.photoUrl ? (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(13,27,42,0.25) 0%, rgba(13,27,42,0.85) 100%)' }} />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="display leading-[0.95]"
          style={{
            // Long department names step down a size rather than break mid-word.
            fontSize: team.name.length > 12 ? 'calc(var(--step-tile) * 0.78)' : 'var(--step-tile)',
            opacity: isWaiting ? 0.5 : 1,
            overflowWrap: 'anywhere',
          }}
        >
          {team.name}
        </span>
        {isDone ? (
          <span aria-label="completed" style={{ color: 'var(--color-mint)', fontSize: 'var(--step-tile)' }}>
            ✓
          </span>
        ) : null}
      </div>

      {team.segmentLabel ? (
        <span
          className="relative mt-2"
          style={{
            fontSize: 'var(--step-small)',
            color: isDone ? 'var(--color-mint)' : 'var(--color-chalk)',
            opacity: isDone ? 1 : 0.85,
          }}
        >
          {team.segmentLabel}
        </span>
      ) : null}
    </div>
  )
}

export interface BoardProps {
  board: BoardData
  /** Copy at the bottom: the call to action, or where the screen is. */
  canSpin: boolean
  kioskLocation: string
  photoPrize: string
}

export default function Board({ board, canSpin, kioskLocation, photoPrize }: BoardProps) {
  const progress = board.teamCount > 0 ? board.spunCount / board.teamCount : 0

  return (
    <div className="flex h-full w-full flex-col gap-[clamp(1rem,1.8vh,2rem)] p-[clamp(1.25rem,2.2vw,3rem)]">
      <header className="flex flex-wrap items-end justify-between gap-[clamp(1rem,2vw,2.5rem)]">
        <div>
          <p className="display opacity-70" style={{ fontSize: 'var(--step-small)', letterSpacing: '0.14em' }}>
            Reps banked today
          </p>
          {/* The one number the whole room is here for. */}
          <div className="display" style={{ fontSize: 'var(--step-counter)' }}>
            <RepCounter value={board.repsBanked} />
          </div>
        </div>

        <div className="min-w-[clamp(18rem,28vw,34rem)] flex-1">
          <p style={{ fontSize: 'var(--step-body)' }}>
            <strong style={{ fontWeight: 700 }}>{board.spunCount}</strong> of{' '}
            <strong style={{ fontWeight: 700 }}>{board.teamCount}</strong> teams have spun
          </p>
          <div
            className="mt-2 h-[clamp(1rem,1.4vh,1.5rem)] w-full overflow-hidden rounded-full"
            style={{ background: 'var(--color-lane)' }}
            role="progressbar"
            aria-valuenow={board.spunCount}
            aria-valuemin={0}
            aria-valuemax={board.teamCount}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--color-mint)', transition: 'width 600ms ease-out' }}
            />
          </div>
        </div>

        <div className="text-right">
          <p className="display opacity-70" style={{ fontSize: 'var(--step-small)', letterSpacing: '0.14em' }}>
            Power-Ups won
          </p>
          <p className="display" style={{ fontSize: 'var(--step-title)', color: 'var(--color-amber)' }}>
            {board.powerUpCount}
          </p>
        </div>
      </header>

      <main
        className="grid min-h-0 flex-1 gap-[clamp(0.6rem,1vw,1.1rem)]"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(12rem, 16vw, 18rem), 1fr))',
          gridAutoRows: '1fr',
        }}
      >
        {board.teams.map((team) => (
          <Tile key={team.name} team={team} />
        ))}
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-[clamp(0.75rem,1.5vw,2rem)]">
        {/* Permanent, all day. This is what keeps photo participation alive. */}
        <p
          className="rounded-full px-[1.2em] py-[0.5em]"
          style={{ border: '3px solid var(--color-amber)', color: 'var(--color-amber)', fontSize: 'var(--step-small)' }}
        >
          Best team photo wins a {photoPrize} too — take one after your spin.
        </p>

        {canSpin ? (
          <p className="display pulse" style={{ fontSize: 'var(--step-title)' }}>
            Tap to spin
          </p>
        ) : (
          <p style={{ fontSize: 'var(--step-body)', opacity: 0.7 }}>Spin at the screen in {kioskLocation}.</p>
        )}
      </footer>
    </div>
  )
}
