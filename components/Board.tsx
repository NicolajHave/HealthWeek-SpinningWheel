'use client'

import type { Board as BoardData, BoardTeam } from '@/app/actions'
import RepCounter from './RepCounter'
import { Lockup, RegistrationMarks } from './Marks'

function Tile({ team }: { team: BoardTeam }) {
  const isWaiting = team.status === 'waiting'
  const isDone = team.status === 'done'
  const hasPhoto = Boolean(team.photoUrl)
  // Done tiles invert to solid ink. At three metres that reads before the text does.
  const onInk = isDone

  return (
    <div
      className="fade-in relative flex min-h-0 flex-col justify-between overflow-hidden p-[clamp(0.7rem,1vw,1.15rem)]"
      aria-label={`${team.name}: ${team.status === 'waiting' ? 'has not spun' : team.status === 'done' ? `${team.segmentLabel}, completed` : `${team.segmentLabel}, not yet confirmed`}`}
      style={{
        border: `2px solid ${isWaiting ? 'var(--color-rule)' : 'var(--color-ink)'}`,
        background: isDone ? 'var(--color-ink)' : 'transparent',
        backgroundImage: team.photoUrl ? `url(${team.photoUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: onInk ? 'var(--color-paper)' : 'var(--color-ink)',
      }}
    >
      {hasPhoto ? (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(17,17,17,0.15) 0%, rgba(17,17,17,0.8) 100%)' }}
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="display"
          style={{
            // Long department names step down a size rather than break mid-word.
            fontSize: team.name.length > 12 ? 'calc(var(--step-tile) * 0.8)' : 'var(--step-tile)',
            fontWeight: 500,
            color: isWaiting ? 'var(--color-mute)' : undefined,
            overflowWrap: 'anywhere',
          }}
        >
          {team.name}
        </span>
      </div>

      {team.segmentLabel ? (
        <span className="label relative mt-2" style={{ opacity: onInk || hasPhoto ? 0.85 : 0.7 }}>
          {team.segmentLabel}
        </span>
      ) : null}
    </div>
  )
}

/** A numbered section heading, as the guideline sheets set them. */
function Section({ n, title, children, className, style }: {
  n: string
  title: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <section className={className} style={style}>
      <p className="label rule pt-[0.6em]" style={{ color: 'var(--color-mute)' }}>
        {n}. {title}
      </p>
      {children}
    </section>
  )
}

export interface BoardProps {
  board: BoardData
  canSpin: boolean
  kioskLocation: string
  photoPrize: string
}

export default function Board({ board, canSpin, kioskLocation, photoPrize }: BoardProps) {
  const progress = board.teamCount > 0 ? board.spunCount / board.teamCount : 0

  return (
    <div className="relative h-full w-full">
      <RegistrationMarks />

      <div className="flex h-full w-full flex-col gap-[clamp(0.9rem,1.6vh,1.9rem)] p-[clamp(1.5rem,2.6vw,3.5rem)]">
        <header className="flex items-baseline justify-between gap-6">
          <Lockup />
          <p className="label" style={{ color: 'var(--color-mute)' }}>
            One spin per team
          </p>
        </header>

        <div className="grid gap-[clamp(1rem,2.5vw,3rem)]" style={{ gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 0.5fr)' }}>
          <Section n="1" title="Reps banked today">
            <div className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <RepCounter value={board.repsBanked} />
            </div>
          </Section>

          <Section n="2" title="Teams that have spun">
            <p className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <span className="mono">{board.spunCount}</span>
              <span style={{ color: 'var(--color-mute)' }}>/{board.teamCount}</span>
            </p>
            <div
              className="mt-[0.4em] h-[clamp(0.7rem,1vh,1.1rem)] w-full"
              style={{ border: '2px solid var(--color-ink)' }}
              role="progressbar"
              aria-valuenow={board.spunCount}
              aria-valuemin={0}
              aria-valuemax={board.teamCount}
            >
              <div
                className="h-full"
                style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--color-ink)', transition: 'width 600ms ease-out' }}
              />
            </div>
          </Section>

          <Section n="3" title="Power-Ups won">
            <p className="display" style={{ fontSize: 'var(--step-counter)', fontWeight: 400 }}>
              <span className="mono">{board.powerUpCount}</span>
            </p>
          </Section>
        </div>

        <Section n="4" title="Teams" className="flex min-h-0 flex-1 flex-col">
          <div
            className="mt-[0.6em] grid min-h-0 flex-1 gap-[clamp(0.5rem,0.8vw,0.9rem)]"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(12rem, 16vw, 18rem), 1fr))',
              gridAutoRows: '1fr',
            }}
          >
            {board.teams.map((team) => (
              <Tile key={team.name} team={team} />
            ))}
          </div>
        </Section>

        <footer className="rule flex flex-wrap items-center justify-between gap-4 pt-[0.7em]">
          {/* Permanent, all day. This is what keeps photo participation alive. */}
          <p className="label">Best team photo wins a {photoPrize} — take one after your spin</p>

          {canSpin ? (
            <p className="display pulse" style={{ fontSize: 'var(--step-title)', fontWeight: 400 }}>
              Tap to spin
            </p>
          ) : (
            <p className="label" style={{ color: 'var(--color-mute)' }}>
              Spin at the screen in {kioskLocation}
            </p>
          )}
        </footer>
      </div>
    </div>
  )
}
